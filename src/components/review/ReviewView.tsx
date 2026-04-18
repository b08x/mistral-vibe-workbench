import React from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Textarea } from '../ui';
import { ArrowLeft, Play, Edit2, CheckCircle } from 'lucide-react';

export const ReviewView: React.FC = () => {
  const { workspace, updateWorkspace } = useWorkspace();

  const handleStartGeneration = () => {
    updateWorkspace({ meta: { ...workspace.meta, status: 'generating' } });
  };

  const handleEdit = (questionId: string, newValue: any) => {
    const nextAnswers = { ...workspace.session.answers, [questionId]: newValue };
    updateWorkspace({ session: { ...workspace.session, answers: nextAnswers } });
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <header className="flex justify-between items-center mb-8">
        <div>
          <Button variant="ghost" onClick={() => updateWorkspace({ meta: { ...workspace.meta, status: 'questions' } })}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Questions
          </Button>
          <h1 className="text-3xl font-bold mt-4 tracking-tight uppercase">Generation Review</h1>
        </div>
        <Button size="lg" onClick={handleStartGeneration} className="bg-emerald-600 hover:bg-emerald-500">
          <Play className="w-4 h-4 mr-2" /> Initialize Artifact Generation
        </Button>
      </header>

      <div className="space-y-6">
        <Card className="border-emerald-500/20 bg-emerald-50/10">
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase tracking-widest text-emerald-600 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" /> Final Context Catalog
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We have synthesized your requirements into a structured context map. 
              The Universal Generation Control Surface will now use this catalog to ground the 3-phase generation flow.
            </p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(workspace.session.answers).map(([qid, ans]) => (
            <Card key={qid} className="hover:border-primary/20 transition-all">
              <CardHeader className="p-4 pb-0 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {qid.replace(/_/g, ' ')}
                </CardTitle>
                <Edit2 className="w-3 h-3 text-muted-foreground/40" />
              </CardHeader>
              <CardContent className="p-4 pt-1">
                {typeof ans === 'boolean' ? (
                  <div className="font-semibold text-lg">{ans ? 'YES' : 'NO'}</div>
                ) : typeof ans === 'string' && ans.length > 50 ? (
                  <Textarea 
                    defaultValue={ans} 
                    onBlur={(e) => handleEdit(qid, e.target.value)} 
                    className="mt-2 text-sm border-none bg-transparent p-0 shadow-none resize-none focus-visible:ring-0 min-h-[60px]"
                  />
                ) : (
                  <Input 
                    defaultValue={String(ans)} 
                    onBlur={(e) => handleEdit(qid, e.target.value)}
                    className="mt-2 font-semibold text-lg border-none bg-transparent p-0 shadow-none focus-visible:ring-0"
                  />
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
