import React, { useEffect, useState } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { Card, CardContent, CardHeader, CardTitle, Button, Progress, Alert, AlertTitle, AlertDescription } from '../ui';
import { GenerationOrchestrator } from '../../lib/generation/orchestrator';
import { ProviderRegistry } from '../../lib/providers/registry';
import { WorkspaceManager } from '../../lib/storage/workspace-manager';
import { 
  CheckCircle2, 
  Circle, 
  Loader2, 
  AlertTriangle, 
  Wrench, 
  ArrowRight,
  Database,
  PenTool,
  SearchCheck,
  Zap,
  ShieldAlert,
  Box,
  FileText
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { ComplianceStatus, InterventionRecord } from '../../types';

export const GenerationView: React.FC = () => {
  const { workspace, updateWorkspace } = useWorkspace();
  const [error, setError] = useState<string | null>(null);
  const [activePhaseIndex, setActivePhaseIndex] = useState(0);

  useEffect(() => {
    const startGen = async () => {
      if (workspace.meta.status !== 'generating') return;

      const modelProviderId = workspace.session.answers.model_provider || 'mistral';
      const modelId = workspace.session.answers.model_name || 'mistral-large-latest';
      const apiKey = WorkspaceManager.getAPIKey(modelProviderId);

      if (!apiKey) {
        setError(`Please configure your API key for ${modelProviderId} in the settings menu before generating.`);
        return;
      }

      const registry = ProviderRegistry.getInstance();
      const provider = registry.get(modelProviderId);

      if (!provider) {
        setError(`Provider ${modelProviderId} not found in registry.`);
        return;
      }

      const orchestrator = new GenerationOrchestrator(workspace, provider, apiKey, modelId);
      
      try {
        // Simple phase simulation for UI feedback
        setActivePhaseIndex(0);
        await new Promise(r => setTimeout(r, 1000));
        setActivePhaseIndex(1);
        await new Promise(r => setTimeout(r, 2000));
        setActivePhaseIndex(2);

        const nextWorkspace = await orchestrator.generate();
        updateWorkspace({ 
          ...nextWorkspace, 
          meta: { ...nextWorkspace.meta, status: 'complete' } 
        });
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Generation failed. Check console for details.');
        updateWorkspace({ meta: { ...workspace.meta, status: 'error' } });
      }
    };

    startGen();
  }, [workspace.meta.status]);

  const getPhaseStatus = (phase: string) => {
    if (workspace.generation.currentPhase === phase) return 'active';
    if (workspace.generation.currentPhase === null && workspace.meta.status === 'complete') return 'complete';
    
    const phases = ['context_gathering', 'drafting', 'review'];
    const currentIdx = phases.indexOf(workspace.generation.currentPhase as string);
    const phaseIdx = phases.indexOf(phase);
    
    if (currentIdx === -1) return 'pending';
    return phaseIdx < currentIdx ? 'complete' : 'pending';
  };

  return (
    <div className="max-w-4xl mx-auto py-20 px-6">
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-bg-surface border border-mistral-orange/30 mb-4">
           <div className="w-2 h-2 rounded-full bg-mistral-orange animate-pulse" />
           <span className="text-[10px] font-mono font-bold text-mistral-orange uppercase tracking-widest">Synthesis Engine Active</span>
        </div>
        <h2 className="text-4xl font-extrabold tracking-tighter mb-4 text-text-main uppercase text-center">
           Executing <span className="text-mistral-orange">Generative Sequence</span>
        </h2>
        <p className="text-xs font-mono text-text-dim uppercase tracking-[0.2em]">
           Universal Generation Control Surface • Phase {activePhaseIndex + 1}
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-12 border-destructive/50 bg-destructive/5">
          <ShieldAlert className="w-4 h-4" />
          <AlertTitle className="font-mono font-bold uppercase tracking-widest">Generation Inhibited</AlertTitle>
          <AlertDescription>
            {error}
            <div className="mt-4">
              <Button size="sm" variant="outline" onClick={() => updateWorkspace({ meta: { ...workspace.meta, status: 'review' } })} className="font-mono text-[10px]">
                REVERT_TO_REVIEW
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* THREE-PHASE BOARD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <PhaseIndicator 
          phase="context_gathering" 
          status={getPhaseStatus('context_gathering')} 
          icon={Database}
          title="Context Gathering"
          description="Grounding generation in user-provided context catalog"
        />
        <PhaseIndicator 
          phase="drafting" 
          status={getPhaseStatus('drafting')} 
          icon={PenTool}
          title="Drafting"
          description="Synthesizing artifact per output type profile"
        />
        <PhaseIndicator 
          phase="review" 
          status={getPhaseStatus('review')} 
          icon={SearchCheck}
          title="Review & Audit"
          description="SRE failure mode detection and compliance audit"
        />
      </div>

      {/* DIMENSION MONITORING */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="bg-bg-surface/50 border-[#28282b] glow-shadow">
          <CardHeader>
            <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] flex items-center gap-2 text-text-main">
              <Zap className="w-4 h-4 text-mistral-orange" /> Behavioral Registers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(workspace.generation.dimensionCompliance).map(([dim, comp]: [string, ComplianceStatus]) => (
              <div key={dim} className="flex flex-col gap-1.5 group">
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="font-bold uppercase tracking-wider text-text-dim group-hover:text-text-main transition-colors">{dim}</span>
                  <span className="px-1.5 py-0.5 rounded bg-bg-deep text-[9px] text-mistral-orange border border-mistral-orange/20">{comp.targetRegister}</span>
                </div>
                <div className="h-1.5 w-full bg-bg-deep overflow-hidden rounded-full border border-[#28282b]">
                   <div className={cn("h-full transition-all duration-1000", comp.compliant ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-destructive shadow-[0_0_8px_rgba(239,68,68,0.5)]")} style={{ width: comp.compliant ? '100%' : '50%' }} />
                </div>
              </div>
            ))}
            {Object.keys(workspace.generation.dimensionCompliance).length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-text-dim/50 text-[10px] font-mono italic text-center leading-relaxed">
                <Loader2 className="w-6 h-6 mb-4 animate-spin opacity-20" />
                Awaiting telemetry handshake...<br/>
                initializing dimension registers
              </div>
            )}
          </CardContent>
        </Card>

        {/* INTERVENTION LOG */}
        <Card className="bg-bg-deep border-[#28282b] flex flex-col h-full overflow-hidden">
           <header className="px-5 py-3 border-b border-[#28282b] bg-bg-surface flex items-center justify-between">
              <div className="flex items-center gap-2">
                 <ShieldAlert className="w-3.5 h-3.5 text-mistral-orange" />
                 <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-text-main">Intervention Console</span>
              </div>
              <div className="text-[9px] font-mono text-text-dim font-bold animate-pulse">MONITORING_ACTIVE</div>
           </header>
           <CardContent className="p-0 flex-1 overflow-auto">
             <div className="p-5 font-mono text-[10px] space-y-3">
               {workspace.generation.interventionsApplied && workspace.generation.interventionsApplied.length > 0 ? (
                 workspace.generation.interventionsApplied.map((record, i) => (
                   <div key={i} className="p-3 bg-mistral-orange/5 border border-mistral-orange/20 rounded shadow-inner animate-in slide-in-from-left duration-300">
                     <div className="text-[9px] font-bold text-mistral-orange uppercase mb-1">DETECTION: {record.failureMode}</div>
                     <div className="text-text-dim leading-relaxed">ACTION: {record.intervention}</div>
                   </div>
                 ))
               ) : (
                 <div className="flex flex-col items-center justify-center py-12 text-emerald-500/30 text-[10px] italic text-center leading-relaxed">
                   <CheckCircle2 className="w-6 h-6 mb-4 opacity-20" />
                   NOMINAL OPERATION<br/>
                   behavioral compliance verified
                 </div>
               )}
               {workspace.generation.failureModeDetected && workspace.generation.failureModeDetected.length > 0 && (
                  workspace.generation.failureModeDetected.map(mode => (
                    <div key={mode} className="text-destructive font-bold uppercase tracking-widest flex items-center gap-2">
                       <AlertTriangle className="w-3 h-3" /> CRITICAL: {mode}
                    </div>
                  ))
               )}
             </div>
           </CardContent>
        </Card>
      </div>
    </div>
  );
};

interface PhaseIndicatorProps {
  phase: string;
  status: 'pending' | 'active' | 'complete' | 'error' | 'idle'; // Adding idle for type safety
  icon: any;
  title: string;
  description: string;
}

const PhaseIndicator: React.FC<PhaseIndicatorProps> = ({ status, icon: Icon, title, description }) => {
  return (
    <Card className={cn(
      "relative overflow-hidden transition-all duration-500 border-[#28282b] bg-bg-surface/50",
      status === 'active' && "border-mistral-orange/50 ring-1 ring-mistral-orange/20 bg-bg-surface glow-shadow"
    )}>
      <div className={cn(
          "absolute top-0 right-10 px-3 py-0.5 rounded-b text-[8px] font-bold uppercase tracking-widest",
           status === 'active' ? "bg-mistral-orange text-white shadow-[0_0_10px_rgba(255,90,31,0.5)]" : 
           status === 'complete' ? "bg-emerald-500 text-white" : "bg-bg-elevated text-text-dim"
      )}>
         {status.toUpperCase()}
      </div>

      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2 rounded border transition-all duration-500",
            status === 'active' ? "bg-bg-deep border-mistral-orange/50 text-mistral-orange animate-pulse" : 
            status === 'complete' ? "bg-bg-deep border-emerald-500/50 text-emerald-500" : "bg-bg-deep border-[#28282b] text-text-dim"
          )}>
             <Icon className="w-5 h-5" />
          </div>
          <CardTitle className="text-[11px] font-mono font-bold uppercase tracking-wider">
            {title}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-[11px] text-text-dim leading-relaxed font-mono opacity-80">{description}</p>
        {status === 'active' && (
           <div className="mt-6 space-y-4">
              <div className="h-1 w-full bg-bg-deep rounded-full overflow-hidden border border-[#28282b]">
                 <div className="h-full bg-mistral-orange animate-progress" />
              </div>
              <div className="flex justify-between text-[9px] font-mono text-mistral-orange animate-pulse font-bold tracking-widest">
                 <span>STABILIZING_DIMENSIONS...</span>
                 <span>SYNC_OK</span>
              </div>
           </div>
        )}
      </CardContent>
    </Card>
  );
};
