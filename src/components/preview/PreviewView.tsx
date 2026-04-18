import React, { useState } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { Card, CardContent, CardHeader, CardTitle, Button, Alert, AlertTitle, AlertDescription } from '../ui';
import { 
  Download, 
  Copy, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Zap,
  Box,
  Code2
} from 'lucide-react';
import { ComplianceStatus } from '../../types';
import { cn } from '../../lib/utils';

export const PreviewView: React.FC = () => {
  const { workspace, updateWorkspace, resetWorkspace } = useWorkspace();
  const [copied, setCopied] = useState(false);
  const [showCompliance, setShowCompliance] = useState(false);

  const handleDownload = () => {
    const content = workspace.artifacts.generatedContent;
    if (!content) return;

    const extension = workspace.meta.outputFormat;
    const filename = `${workspace.session.answers.agent_name || workspace.session.answers.skill_name || 'artifact'}.${extension}`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    const content = workspace.artifacts.generatedContent;
    if (!content) return;
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isStrictlyCompliant = Object.values(workspace.generation.dimensionCompliance).every(c => (c as ComplianceStatus).compliant);

  return (
    <div className="max-w-6xl mx-auto py-12 px-6">
      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 mb-3">
             <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
             <span className="text-[10px] font-mono font-bold text-emerald-500 uppercase tracking-widest">Synthesis Complete</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tighter text-text-main uppercase">
             Generated <span className="text-mistral-orange">Artifact</span>
          </h1>
          <p className="text-xs font-mono text-text-dim uppercase tracking-[0.2em] mt-1">
             Profile: {workspace.meta.entityType} • Engine: {workspace.artifacts.model}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => updateWorkspace({ meta: { ...workspace.meta, status: 'review' } })} className="font-mono text-xs tracking-widest h-12 px-8 border-[#28282b]">
            <ArrowLeft className="w-4 h-4 mr-2" /> REVERT_ADJUST
          </Button>
          <Button onClick={handleDownload} className="font-mono text-xs tracking-widest h-12 px-8 shadow-lg shadow-mistral-orange/20">
            <Download className="w-4 h-4 mr-2" /> DOWNLOAD_FILE
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Code Preview */}
        <div className="lg:col-span-3">
           <Card className="border-[#28282b] flex flex-col h-full overflow-hidden bg-[#121214] glow-shadow">
             <div className="bg-bg-deep h-10 flex items-center px-4 border-b border-[#28282b]">
                <div className="flex gap-1.5 mr-auto">
                   <div className="w-2.5 h-2.5 rounded-full bg-destructive/30 border border-destructive/20" />
                   <div className="w-2.5 h-2.5 rounded-full bg-mistral-amber/30 border border-mistral-amber/20" />
                   <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/30 border border-emerald-500/20" />
                </div>
                <div className="text-[10px] font-mono text-text-dim flex items-center gap-2 px-3 py-1 bg-bg-surface rounded border border-[#28282b]">
                   <Code2 className="w-3.5 h-3.5" />
                   {workspace.meta.entityType === 'agent' ? 'agent.toml' : workspace.meta.entityType === 'skill' ? 'SKILL.md' : 'system_prompt.md'}
                </div>
                <Button variant="ghost" size="sm" onClick={handleCopy} className="ml-4 h-8 px-2 text-[10px] font-mono">
                  {copied ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span className="ml-2">{copied ? 'BUFFER_COPIED' : 'COPY_BUFFER'}</span>
                </Button>
             </div>
             <CardContent className="p-0 overflow-auto flex-1 min-h-[600px] bg-gradient-to-br from-[#151518] to-[#080809] relative group">
               <div className="absolute inset-0 opacity-[0.02] pointer-events-none group-hover:opacity-[0.04] transition-opacity" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
               <pre className="p-8 font-mono text-sm leading-relaxed text-[#9cdcfe] relative z-10 selection:bg-mistral-orange/30">
                 <code>{workspace.artifacts.generatedContent}</code>
               </pre>
             </CardContent>
           </Card>
        </div>

        {/* COMPLIANCE & META */}
        <div className="space-y-6">
           {/* COMPLIANCE STATUS BAR */}
           <Card className={cn("bg-bg-deep border-[#28282b] overflow-hidden", isStrictlyCompliant ? "border-emerald-500/30" : "border-mistral-amber/30")}>
              <header className="bg-bg-surface px-4 py-2 border-b border-[#28282b] text-[10px] font-mono font-bold uppercase tracking-widest flex items-center justify-between">
                 <div className="flex items-center gap-2">
                    <ShieldCheck className={cn("w-3.5 h-3.5", isStrictlyCompliant ? 'text-emerald-500' : 'text-mistral-amber')} />
                    Compliance Audit
                 </div>
                 <span className={cn("px-1.5 py-0.5 rounded text-[8px]", isStrictlyCompliant ? "bg-emerald-500 text-white" : "bg-mistral-amber text-black")}>
                   {isStrictlyCompliant ? "SECURE" : "ADAPTED"}
                 </span>
              </header>
              <CardContent className="p-4 space-y-5">
                 <p className="text-[10px] text-text-dim leading-relaxed font-mono">Behavioral dimensions stabilized via UGCS registers.</p>
                 <Button variant="outline" size="sm" className="w-full text-[10px] h-8 font-mono border-[#28282b]" onClick={() => setShowCompliance(!showCompliance)}>
                   {showCompliance ? <ChevronDown className="w-3 h-3 mr-2" /> : <ChevronRight className="w-3 h-3 mr-2" />}
                   {showCompliance ? 'HIDE' : 'VIEW'} DETAILS
                 </Button>
              </CardContent>
           </Card>

          {showCompliance && (
            <Card className="bg-bg-deep border-[#28282b] glow-shadow">
              <header className="bg-bg-surface px-4 py-2 border-b border-[#28282b] text-[10px] font-mono font-bold uppercase tracking-widest text-text-main flex items-center gap-2">
                 <Zap className="w-3.5 h-3.5 text-mistral-orange" />
                 Dimension Analysis
              </header>
              <CardContent className="space-y-4 pt-4">
                 {Object.entries(workspace.generation.dimensionCompliance).map(([dim, comp]) => {
                   const c = comp as ComplianceStatus;
                   return (
                     <div key={dim} className="flex flex-col gap-1 pb-4 border-b last:border-0">
                        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          <span>{dim}</span>
                          <span className={c.compliant ? 'text-emerald-500' : 'text-amber-500'}>
                            {c.compliant ? 'Compliant' : 'Deviation Corrected'}
                          </span>
                        </div>
                        <div className="text-xs mt-1 leading-snug">{c.notes}</div>
                     </div>
                   );
                 })}
              </CardContent>
            </Card>
          )}

          {workspace.generation.failureModeDetected && workspace.generation.failureModeDetected.length > 0 && (
            <Alert variant="destructive" className="bg-destructive/5 border-destructive/20 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-destructive/50" />
              <AlertCircle className="w-4 h-4 text-destructive" />
              <AlertTitle className="text-[10px] font-mono font-bold uppercase tracking-widest text-destructive">Audit Warnings</AlertTitle>
              <AlertDescription className="text-[10px] font-mono leading-relaxed text-destructive/80 mt-1 uppercase">
                Intercepted {workspace.generation.failureModeDetected.length} potential failure modes during review loop.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col gap-2">
             <Alert className="bg-bg-elevated/50 border-[#28282b]">
                <div className="text-[10px] font-mono leading-relaxed text-text-dim">
                   <span className="text-mistral-orange font-bold uppercase tracking-widest mb-1 block underline underline-offset-4">Synthesis Metadata</span> 
                   <div className="space-y-1">
                     <div>TOKENS: {workspace.artifacts.tokensUsed?.toLocaleString() || 0}</div>
                     <div>ENGINE: {workspace.artifacts.model}</div>
                     <div>LATENCY: {(workspace.generation.generationTime / 1000).toFixed(1)}s</div>
                   </div>
                </div>
             </Alert>
          </div>
        </div>
      </div>
    </div>
  );
};
