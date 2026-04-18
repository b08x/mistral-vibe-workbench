import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { VibeWorkspace, WorkspaceMeta, AgentConfigState, SkillDefinitionState, SystemPromptState } from '../types';
import { WorkspaceManager } from '../lib/storage/workspace-manager';

interface WorkspaceContextType {
  workspace: VibeWorkspace;
  updateWorkspace: (updates: Partial<VibeWorkspace>) => void;
  resetWorkspace: () => void;
  saveWorkspace: () => void;
  isReady: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

const INITIAL_META: WorkspaceMeta = {
  entityType: 'agent',
  outputFormat: 'toml',
  status: 'entity-selection',
  currentSection: null,
  currentQuestion: null,
  questionsAnswered: 0,
  questionsTotal: 0,
  sectionsComplete: [],
  createdAt: new Date(),
  lastModifiedAt: new Date(),
  generatedAt: null
};

export const INITIAL_WORKSPACE: VibeWorkspace = {
  meta: INITIAL_META,
  session: {
    answers: {},
    history: [],
    currentIndex: 0,
    activeModule: '',
    conversationSummary: null
  },
  artifacts: {
    generatedContent: null,
    additionalFiles: {},
    model: null,
    provider: null,
    tokensUsed: null,
    generationTime: null
  },
  generation: {
    currentPhase: null,
    dimensionCompliance: {},
    failureModeDetected: null,
    interventionsApplied: null,
    contextMap: null,
    draftArtifact: null,
    generationTime: 0
  },
  validation: null,
  workbench_settings: {
    phase_models: {
      context_gathering: { provider: 'mistral', model: 'mistral-small-latest', temperature: 0.1 },
      drafting:          { provider: 'mistral', model: 'mistral-large-latest', temperature: 0.4 },
      review:            { provider: 'mistral', model: 'mistral-small-latest', temperature: 0.1 }
    },
    available_models: {},
    key_status: {}
  }
};

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [workspace, setWorkspace] = useState<VibeWorkspace>(INITIAL_WORKSPACE);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const loaded = WorkspaceManager.load();
    const savedModelSettings = WorkspaceManager.loadModelSettings();

    if (loaded) {
      const merged = {
        ...INITIAL_WORKSPACE,
        ...loaded,
        meta: { ...INITIAL_WORKSPACE.meta, ...loaded.meta },
        workbench_settings: {
          ...INITIAL_WORKSPACE.workbench_settings,
          ...(loaded.workbench_settings || {}),
          ...(savedModelSettings ? { phase_models: savedModelSettings.phase_models } : {}),
          // Always reset runtime state on load
          available_models: {},
          key_status: {}
        }
      };
      setWorkspace(merged);
    } else if (savedModelSettings) {
      setWorkspace({
        ...INITIAL_WORKSPACE,
        workbench_settings: {
          ...INITIAL_WORKSPACE.workbench_settings,
          phase_models: savedModelSettings.phase_models
        }
      });
    }
    setIsReady(true);
  }, []);

  const updateWorkspace = useCallback((updates: Partial<VibeWorkspace>) => {
    setWorkspace(prev => {
      const next = { ...prev, ...updates, meta: { ...prev.meta, ...updates.meta, lastModifiedAt: new Date() } };
      WorkspaceManager.save(next);
      return next;
    });
  }, []);

  const resetWorkspace = useCallback(() => {
    localStorage.removeItem('vibe_workspace_state'); // Clear from both storage types just in case
    WorkspaceManager.clear();
    setWorkspace(INITIAL_WORKSPACE);
  }, []);

  const saveWorkspace = useCallback(() => {
    WorkspaceManager.save(workspace);
  }, [workspace]);

  return (
    <WorkspaceContext.Provider value={{ workspace, updateWorkspace, resetWorkspace, saveWorkspace, isReady }}>
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};
