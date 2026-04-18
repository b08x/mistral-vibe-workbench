import React, { useEffect } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useModelValidation } from '../../hooks/useModelValidation';
import { ProviderRegistry } from '../../lib/providers/registry';
import {
  Card, CardContent, CardHeader, CardTitle,
  Button, Select, Alert, AlertTitle, AlertDescription
} from '../ui';
import {
  Database, PenTool, SearchCheck, Zap,
  ArrowLeft, AlertTriangle, RefreshCw, Loader2
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { PhaseModelConfig } from '../../types';

const PHASE_META = {
  context_gathering: {
    label: 'Context Gathering',
    description: 'Catalogs requirements from answers. Optimise for speed.',
    icon: Database,
    color: 'text-blue-400'
  },
  drafting: {
    label: 'Drafting',
    description: 'Synthesizes the final artifact. Use the most capable model available.',
    icon: PenTool,
    color: 'text-mistral-orange'
  },
  review: {
    label: 'Review',
    description: 'Validates syntax and failure modes. Optimise for precision.',
    icon: SearchCheck,
    color: 'text-emerald-400'
  }
} as const;

export const GenerationConfigView: React.FC = () => {
  const { workspace, updateWorkspace } = useWorkspace();
  const {
    validateKey,
    setPhaseModel,
    applyTieredDefaults,
    validProviders,
    modelsForProvider,
    canProceedToGeneration,
    keyStatus,
    phaseModels
  } = useModelValidation();

  const registry = ProviderRegistry.getInstance();
  const allProviders = registry.list();

  // Apply tiered defaults on first mount if we now have valid providers
  useEffect(() => {
    if (validProviders.length > 0) {
      const noneConfigured = (['context_gathering', 'drafting', 'review'] as const)
        .every(p => modelsForProvider(phaseModels[p].provider).length === 0);
      if (noneConfigured) applyTieredDefaults();
    }
  }, [validProviders.length]);

  const startGeneration = () => {
    updateWorkspace({ meta: { ...workspace.meta, status: 'generating' } });
  };

  const goBack = () => {
    updateWorkspace({ meta: { ...workspace.meta, status: 'review' } });
  };

  const noValidProviders = validProviders.length === 0;

  return (
    <div className="max-w-3xl mx-auto py-12 px-6">
      {/* Header */}
      <header className="mb-10">
        <button
          onClick={goBack}
          className="flex items-center gap-2 text-xs text-text-dim hover:text-text-main mb-6 transition-colors"
        >
          <ArrowLeft className="w-3 h-3" /> Back to Review
        </button>
        <h1 className="text-3xl font-bold mb-3 tracking-tight uppercase flex items-center gap-3">
          <Zap className="w-8 h-8 text-mistral-orange" /> Generation Config
        </h1>
        <p className="text-muted-foreground text-sm">
          Assign a model to each phase of the three-phase generation pipeline.
          Different models can be used for different phases.
        </p>
      </header>

      {/* API Key Status Summary */}
      <div className="mb-8 flex flex-wrap gap-2">
        {allProviders.map(provider => {
          const status = keyStatus[provider.id] ?? 'unset';
          return (
            <div
              key={provider.id}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded border text-xs font-mono',
                status === 'valid'      && 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400',
                status === 'validating' && 'border-blue-400/30 bg-blue-400/5 text-blue-400',
                status === 'invalid'    && 'border-red-500/30 bg-red-500/5 text-red-400',
                (status === 'unset')    && 'border-[#28282b] text-text-dim'
              )}
            >
              {status === 'validating' && <Loader2 className="w-3 h-3 animate-spin" />}
              {provider.name}
              <span className="opacity-60">
                {status === 'valid' ? '✓' : status === 'invalid' ? '✗' : status === 'validating' ? '…' : '○'}
              </span>
            </div>
          );
        })}
      </div>

      {/* No keys warning */}
      {noValidProviders && (
        <Alert variant="destructive" className="mb-8">
          <AlertTriangle className="w-4 h-4" />
          <AlertTitle>No API Keys Validated</AlertTitle>
          <AlertDescription className="text-xs">
            Open Settings and add at least one valid API key to enable model selection.
          </AlertDescription>
        </Alert>
      )}

      {/* Phase configuration rows */}
      <div className="space-y-4 mb-10">
        {(['context_gathering', 'drafting', 'review'] as const).map(phase => {
          const meta = PHASE_META[phase];
          const Icon = meta.icon;
          const current = phaseModels[phase];
          const models = modelsForProvider(current.provider);

          return (
            <Card key={phase} className={cn(
              'border transition-colors',
              noValidProviders && 'opacity-50 pointer-events-none'
            )}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                  <Icon className={cn('w-4 h-4', meta.color)} />
                  {meta.label}
                </CardTitle>
                <p className="text-xs text-text-dim font-mono uppercase opacity-70">{meta.description}</p>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4 pt-2">
                  {/* Provider select */}
                  <div className="flex-1">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-text-dim mb-1 block">
                      Provider
                    </label>
                    <Select
                      value={current.provider}
                      onChange={(e) => {
                        const newProvider = e.target.value;
                        const providerModels = modelsForProvider(newProvider);
                        const defaultModel = providerModels[0]?.id ?? '';
                        setPhaseModel(phase, {
                          ...current,
                          provider: newProvider,
                          model: defaultModel
                        });
                      }}
                      className="bg-bg-deep border-[#28282b] text-text-main text-[12px]"
                    >
                      {allProviders.map(p => (
                        <option
                          key={p.id}
                          value={p.id}
                          disabled={keyStatus[p.id] !== 'valid'}
                          className="bg-bg-deep"
                        >
                          {p.name}{keyStatus[p.id] !== 'valid' ? ' (key required)' : ''}
                        </option>
                      ))}
                    </Select>
                  </div>

                  {/* Model select */}
                  <div className="flex-[2]">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-text-dim mb-1 block">
                      Model
                    </label>
                    {models.length > 0 ? (
                      <Select
                        value={current.model}
                        onChange={(e) => setPhaseModel(phase, { ...current, model: e.target.value })}
                        className="bg-bg-deep border-[#28282b] text-text-main text-[12px]"
                      >
                        {models.map(m => (
                          <option key={m.id} value={m.id} className="bg-bg-deep">
                            {m.name ?? m.id}
                            {m.context_window ? ` — ${(m.context_window / 1000).toFixed(0)}k ctx` : ''}
                          </option>
                        ))}
                      </Select>
                    ) : (
                      <div className="h-10 px-3 flex items-center border border-[#28282b] rounded text-[11px] text-text-dim font-mono bg-bg-deep italic">
                        {keyStatus[current.provider] === 'validating'
                          ? 'Fetching models...'
                          : 'Validate key to load models'}
                      </div>
                    )}
                  </div>

                  {/* Temperature */}
                  <div className="w-full sm:w-32">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-text-dim mb-1 block">
                      Temp: {current.temperature.toFixed(2)}
                    </label>
                    <div className="flex items-center h-10">
                      <input
                        type="range"
                        min={0} max={1} step={0.05}
                        value={current.temperature}
                        onChange={(e) => setPhaseModel(phase, {
                          ...current,
                          temperature: parseFloat(e.target.value)
                        })}
                        className="w-full h-1.5 accent-mistral-orange bg-[#28282b] rounded-full appearance-none cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Apply tiered defaults shortcut */}
      {validProviders.length > 0 && (
        <div className="flex justify-start mb-8">
          <Button variant="outline" size="sm" onClick={applyTieredDefaults} className="font-mono text-[10px]">
            <RefreshCw className="w-3 h-3 mr-2 text-mistral-orange" /> Reset to Tiered Defaults
          </Button>
        </div>
      )}

      {/* Footer CTA */}
      <div className="flex justify-between items-center pt-8 border-t border-[#28282b]">
        <Button variant="ghost" onClick={goBack} className="font-mono">
          <ArrowLeft className="w-4 h-4 mr-2" /> REVERT_TO_REVIEW
        </Button>
        <Button
          size="lg"
          disabled={!canProceedToGeneration}
          onClick={startGeneration}
          className="h-12 px-10"
        >
          <Zap className="w-4 h-4 mr-2" /> BEGIN_GENERATION_SEQUENCE
        </Button>
      </div>
    </div>
  );
};
