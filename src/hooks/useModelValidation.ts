import { useCallback } from 'react';
import { useWorkspace, INITIAL_WORKSPACE } from '../context/WorkspaceContext';
import { WorkspaceManager } from '../lib/storage/workspace-manager';
import { PhaseModelConfig, ModelInfo } from '../types';

export function useModelValidation() {
  const { workspace, updateWorkspace } = useWorkspace();
  const settings = workspace.workbench_settings || INITIAL_WORKSPACE.workbench_settings;

  const validateKey = useCallback(async (providerId: string, apiKey: string) => {
    if (!settings) return;
    
    updateWorkspace({
      workbench_settings: {
        ...settings,
        key_status: { ...settings.key_status, [providerId]: 'validating' }
      }
    });

    try {
      const response = await fetch('/api/providers/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId, apiKey })
      });

      const result = await response.json();

      updateWorkspace({
        workbench_settings: {
          ...settings,
          key_status: {
            ...settings.key_status,
            [providerId]: result.status
          },
          available_models: {
            ...settings.available_models,
            ...(result.models?.length > 0 ? { [providerId]: result.models } : {})
          }
        }
      });
    } catch (err) {
      console.error('Provider validation failed:', err);
      updateWorkspace({
        workbench_settings: {
          ...settings,
          key_status: { ...settings.key_status, [providerId]: 'invalid' }
        }
      });
    }
  }, [settings, updateWorkspace]);

  const setPhaseModel = useCallback((
    phase: 'context_gathering' | 'drafting' | 'review',
    config: PhaseModelConfig
  ) => {
    const next = {
      ...settings,
      phase_models: { ...settings.phase_models, [phase]: config }
    };
    updateWorkspace({ workbench_settings: next });
    WorkspaceManager.saveModelSettings(next);
  }, [settings, updateWorkspace]);

  const validProviders = Object.entries(settings.key_status)
    .filter(([, status]) => status === 'valid')
    .map(([id]) => id);

  const modelsForProvider = (id: string): ModelInfo[] =>
    settings.available_models[id] ?? [];

  // Tiered default selection: prefer 'large'/'opus'/'pro' for drafting,
  // prefer 'small'/'haiku'/'flash' for context_gathering and review
  const applyTieredDefaults = useCallback(() => {
    if (validProviders.length === 0) return;
    const firstProvider = validProviders[0];
    const models = modelsForProvider(firstProvider);
    if (models.length === 0) return;

    const capable = models.find(m =>
      /large|opus|pro|heavy|max/i.test(m.id)
    ) ?? models[models.length - 1];

    const fast = models.find(m =>
      /small|haiku|flash|mini|nano|lite/i.test(m.id)
    ) ?? models[0];

    const next = {
      ...settings,
      phase_models: {
        context_gathering: { provider: firstProvider, model: fast.id, temperature: 0.1 },
        drafting:          { provider: firstProvider, model: capable.id, temperature: 0.4 },
        review:            { provider: firstProvider, model: fast.id, temperature: 0.1 }
      }
    };
    updateWorkspace({ workbench_settings: next });
    WorkspaceManager.saveModelSettings(next);
  }, [validProviders, settings, updateWorkspace]);

  const canProceedToGeneration = validProviders.length > 0 &&
    (['context_gathering', 'drafting', 'review'] as const).every(phase => {
      const cfg = settings.phase_models[phase];
      return cfg.model && cfg.provider && settings.key_status[cfg.provider] === 'valid';
    });

  return {
    validateKey,
    setPhaseModel,
    applyTieredDefaults,
    validProviders,
    modelsForProvider,
    canProceedToGeneration,
    keyStatus: settings.key_status,
    phaseModels: settings.phase_models
  };
}
