import React, { useState, useEffect } from 'react';
import { useSession } from '../../context/SessionContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, Button, Input, Textarea, Select, Progress, Badge } from '../ui';
import { ArrowLeft, ArrowRight, CheckCircle2, ListFilter, Trash2, Settings2, Check, Save } from 'lucide-react';
import { cn } from '../../lib/utils';

export const QAShell: React.FC = () => {
  const { currentQuestion, answerQuestion, goBack, isComplete, progress, activeModule } = useSession();
  const { workspace, updateWorkspace, resetWorkspace } = useWorkspace();
  const [inputValue, setInputValue] = useState<any>('');

  // Sync internal state with session state when question changes
  useEffect(() => {
    if (currentQuestion) {
      const existingAnswer = workspace.session.answers[currentQuestion.id];
      if (existingAnswer !== undefined) {
        setInputValue(existingAnswer);
      } else {
        // Initialize based on type
        if (currentQuestion.type === 'multi-select' || currentQuestion.type === 'list') {
          setInputValue([]);
        } else if (currentQuestion.type === 'boolean') {
          setInputValue(currentQuestion.default_value ?? '');
        } else {
          setInputValue('');
        }
      }
    }
  }, [currentQuestion?.id]);

  const isValueEmpty = (val: any) => {
    if (val === null || val === undefined || val === '') return true;
    if (Array.isArray(val)) return val.length === 0;
    return false;
  };

  const handleNext = () => {
    if (!isValueEmpty(inputValue) || !currentQuestion?.required) {
      answerQuestion(inputValue);
    }
  };

  if (isComplete) {
    return (
      <div className="max-w-xl mx-auto py-24 text-center">
        <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-6" />
        <h2 className="text-3xl font-bold mb-4">Context Gathering Complete</h2>
        <p className="text-muted-foreground mb-12">
          We have collected enough information to generate your {workspace.meta.entityType}.
        </p>
        <div className="flex gap-4 justify-center">
          <Button variant="outline" onClick={goBack}>Review Answers</Button>
          <Button size="lg" onClick={() => updateWorkspace({ meta: { ...workspace.meta, status: 'review' } })}>
            Proceed to Generation Review
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-full bg-bg-deep">
      {/* LEFT SIDEBAR: Context Monitor */}
      <aside className="w-80 border-r border-[#28282b] bg-bg-surface flex flex-col pt-8">
        <div className="px-6 mb-8">
          <div className="flex items-center gap-3 mb-2">
            <ListFilter className="w-4 h-4 text-mistral-orange" />
            <h3 className="font-bold text-[10px] uppercase tracking-[0.2em] text-text-main">Context Monitor</h3>
          </div>
          <div className="h-px w-full bg-gradient-to-r from-mistral-orange/30 to-transparent" />
        </div>
        
        <div className="flex-1 overflow-y-auto px-6 space-y-3 pb-8">
          {Object.entries(workspace.session.answers).map(([qid, ans]) => (
            <div key={qid} className="p-3 rounded border border-[#28282b] bg-bg-deep group hover:border-mistral-orange/30 transition-colors">
              <div className="text-[9px] font-mono font-bold text-text-dim uppercase tracking-wider mb-1.5 group-hover:text-mistral-orange transition-colors">
                 {qid.replace(/_/g, ' ')}
              </div>
              <div className="text-[11px] font-mono text-text-main truncate">
                 {typeof ans === 'boolean' ? (ans ? 'TRUE' : 'FALSE') : String(ans)}
              </div>
            </div>
          ))}
          {Object.keys(workspace.session.answers).length === 0 && (
            <div className="text-[10px] font-mono text-text-dim/50 italic leading-relaxed">
               Awaiting telemetry initialization...<br/>
               Begin Q&A sequence to populate context cache.
            </div>
          )}
        </div>
      </aside>

      {/* Main Q&A Area */}
      <main className="flex-1 flex flex-col p-8 lg:p-16 relative">
        <div className="max-w-3xl w-full mx-auto flex-1 flex flex-col">
          <header className="mb-20 flex items-center justify-between border-b border-[#28282b] pb-6">
            <div>
              <div className="text-[10px] font-mono font-bold text-mistral-orange uppercase tracking-[0.2em] mb-1">{activeModule?.name}</div>
              <h2 className="text-sm font-mono text-text-main uppercase tracking-widest">{workspace.meta.currentSection || 'Initializing...'}</h2>
            </div>
            <div className="text-right flex items-center gap-6">
              <div className="hidden sm:block">
                 <div className="text-[9px] font-mono text-text-dim uppercase mb-2 tracking-widest">SYNTHESIS PROGRESS: {progress}%</div>
                 <Progress value={progress} className="w-40 h-1.5" />
              </div>
              <div className="w-px h-8 bg-border mx-2" />
            </div>
          </header>

          <section className="flex-1 flex flex-col justify-center">
            {currentQuestion && (
              <div className="w-full space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="space-y-4">
                  <h2 className="text-4xl font-extrabold leading-tight tracking-tighter text-text-main">
                    {currentQuestion.prompt}
                  </h2>
                  {currentQuestion.help_text && (
                    <p className="text-sm text-text-dim font-mono leading-relaxed border-l-2 border-mistral-orange/20 pl-4">
                      {currentQuestion.help_text}
                    </p>
                  )}
                </div>

                <Card className="p-8 bg-bg-surface/30 border-[#28282b] shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-2 opacity-5">
                     <Settings2 className="w-16 h-16" />
                  </div>
                  
                  <div className="space-y-6 relative z-10">
                    {currentQuestion.type === 'text' && (
                      <Input
                        autoFocus
                        placeholder={currentQuestion.placeholder || "Enter value..."}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                        className="h-14 text-xl"
                      />
                    )}
                    {currentQuestion.type === 'textarea' && (
                      <Textarea
                        autoFocus
                        placeholder={currentQuestion.placeholder || "Provide detailed input..."}
                        className="min-h-[200px] text-lg leading-relaxed px-4 py-4"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                      />
                    )}
                    {currentQuestion.type === 'select' && currentQuestion.config && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {(currentQuestion.config as any).options.map((opt: any) => (
                          <Button
                            key={opt.value}
                            variant={inputValue === opt.value ? 'default' : 'outline'}
                            className={cn(
                               "justify-start h-auto py-5 px-6 border-[#28282b] hover:border-mistral-orange/30 transition-all text-left",
                               inputValue === opt.value && "ring-2 ring-mistral-orange/50 ring-offset-2 ring-offset-bg-deep"
                            )}
                            onClick={() => {
                              setInputValue(opt.value);
                              setTimeout(() => answerQuestion(opt.value), 250);
                            }}
                          >
                            <div>
                              <div className={cn("font-bold uppercase tracking-tight text-sm", inputValue === opt.value ? "text-white" : "text-text-main")}>
                                 {opt.label}
                              </div>
                              {opt.description && <div className="text-[10px] opacity-70 mt-1 font-mono uppercase tracking-wider">{opt.description}</div>}
                            </div>
                          </Button>
                        ))}
                      </div>
                    )}
                    {currentQuestion.type === 'boolean' && (
                      <div className="flex gap-6">
                        <Button
                          variant={inputValue === true ? 'default' : 'outline'}
                          className="flex-1 py-16 text-xl font-bold uppercase tracking-widest border-[#28282b]"
                          onClick={() => { setInputValue(true); setTimeout(() => answerQuestion(true), 250); }}
                        >
                          TRUE
                        </Button>
                        <Button
                          variant={inputValue === false ? 'default' : 'outline'}
                          className="flex-1 py-16 text-xl font-bold uppercase tracking-widest border-[#28282b]"
                          onClick={() => { setInputValue(false); setTimeout(() => answerQuestion(false), 250); }}
                        >
                          FALSE
                        </Button>
                      </div>
                    )}
                    {currentQuestion.type === 'list' && (
                      <div className="space-y-4">
                        <div className="flex gap-2">
                          <Input
                            placeholder="Type an item and press Enter..."
                            className="h-12 text-lg"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const val = (e.target as HTMLInputElement).value.trim();
                                if (val) {
                                  const current = Array.isArray(inputValue) ? [...inputValue] : [];
                                  if (!current.includes(val)) {
                                    setInputValue([...current, val]);
                                    (e.target as HTMLInputElement).value = '';
                                  }
                                }
                                e.preventDefault();
                              }
                            }}
                          />
                        </div>
                        <div className="flex flex-wrap gap-2 mt-4 min-h-[40px] p-2 rounded bg-bg-deep/50 border border-[#28282b]/50">
                          {Array.isArray(inputValue) && inputValue.map((item: string, idx: number) => (
                            <Badge key={idx} variant="secondary" className="pl-3 pr-1 py-1.5 flex items-center gap-2 bg-bg-surface border-[#28282b] hover:border-mistral-orange/30 transition-colors">
                              <span className="font-mono text-xs text-[#9cdcfe]">{item}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 hover:bg-destructive hover:text-white rounded-full p-0 transition-colors"
                                onClick={() => setInputValue(inputValue.filter((_: any, i: number) => i !== idx))}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </Badge>
                          ))}
                          {(!Array.isArray(inputValue) || inputValue.length === 0) && (
                            <div className="text-[11px] font-mono text-text-dim/50 italic flex items-center h-8 ml-2">
                               No items added yet. Enter items above.
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    {currentQuestion.type === 'multi-select' && currentQuestion.config && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {(currentQuestion.config as any).options.map((opt: any) => {
                          const isSelected = Array.isArray(inputValue) && inputValue.includes(opt.value);
                          return (
                            <Button
                              key={opt.value}
                              variant={isSelected ? 'default' : 'outline'}
                              className={cn(
                                 "justify-start h-auto py-4 px-5 border-[#28282b] hover:border-mistral-orange/30 transition-all text-left relative",
                                 isSelected && "ring-1 ring-mistral-orange/30"
                              )}
                              onClick={() => {
                                const currentValues = Array.isArray(inputValue) ? [...inputValue] : [];
                                if (isSelected) {
                                  setInputValue(currentValues.filter(v => v !== opt.value));
                                } else {
                                  setInputValue([...currentValues, opt.value]);
                                }
                              }}
                            >
                              <div className="flex items-center gap-3 w-full">
                                <div className={cn(
                                  "w-5 h-5 rounded border flex items-center justify-center transition-colors shrink-0",
                                  isSelected ? "bg-white border-white" : "border-[#3e3e42] bg-bg-deep"
                                )}>
                                  {isSelected && <Check className="w-3.5 h-3.5 text-mistral-orange" />}
                                </div>
                                <div className="flex-1 overflow-hidden">
                                  <div className={cn("font-bold uppercase tracking-tight text-[11px] truncate", isSelected ? "text-white" : "text-text-main")}>
                                     {opt.label}
                                  </div>
                                  {opt.description && <div className="text-[9px] opacity-60 mt-0.5 font-mono leading-tight truncate">{opt.description}</div>}
                                </div>
                              </div>
                            </Button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            )}
          </section>

          <footer className="mt-auto py-12 flex justify-between items-center border-t border-[#28282b]">
            <div className="flex gap-4">
              <Button variant="ghost" onClick={goBack} disabled={workspace.session.history.length === 0} className="font-mono text-[11px] tracking-widest h-10 px-6">
                <ArrowLeft className="w-3.5 h-3.5 mr-2" /> REVERT_STEP
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => {
                  updateWorkspace({ ...workspace });
                  const btn = document.getElementById('checkpoint-btn');
                  if (btn) {
                    const originalText = btn.innerHTML;
                    btn.innerHTML = 'CHECKPOINT_SAVED';
                    btn.classList.add('text-emerald-500');
                    setTimeout(() => {
                      btn.innerHTML = originalText;
                      btn.classList.remove('text-emerald-500');
                    }, 2000);
                  }
                }}
                id="checkpoint-btn"
                className="font-mono text-[11px] tracking-widest h-10 px-6 hidden sm:flex items-center"
              >
                <Save className="w-3.5 h-3.5 mr-2" /> SAVE_CHECKPOINT
              </Button>
            </div>
            <div className="flex gap-4">
              <Button variant="ghost" className="text-destructive/60 hover:text-white hover:bg-destructive font-mono text-[11px] tracking-widest h-10 px-6" onClick={resetWorkspace}>
                <Trash2 className="w-3.5 h-3.5 mr-2" /> EMERGENCY_RESET
              </Button>
              <Button size="lg" onClick={handleNext} disabled={currentQuestion?.required && isValueEmpty(inputValue)} className="font-mono tracking-[0.2em] shadow-lg shadow-mistral-orange/20">
                PROCEED <ArrowRight className="w-3.5 h-3.5 ml-2" />
              </Button>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
};
