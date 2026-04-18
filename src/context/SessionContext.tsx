import React, { createContext, useContext, useMemo, useCallback } from 'react';
import { QuestionNavigator } from '../lib/questions/navigator';
import { useWorkspace } from './WorkspaceContext';
import { agentConfigModule } from '../lib/questions/modules/agent-config';
import { skillDefinitionModule } from '../lib/questions/modules/skill-definition';
import { systemPromptModule } from '../lib/questions/modules/system-prompt';
import { QuestionModule, Question } from '../types';

interface SessionContextType {
  activeModule: QuestionModule | null;
  currentQuestion: Question | null;
  answerQuestion: (answer: any) => void;
  goBack: () => void;
  isComplete: boolean;
  progress: number;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { workspace, updateWorkspace } = useWorkspace();

  const activeModule = useMemo(() => {
    switch (workspace.meta.entityType) {
      case 'agent': return agentConfigModule;
      case 'skill': return skillDefinitionModule;
      case 'system-prompt': return systemPromptModule;
      default: return null;
    }
  }, [workspace.meta.entityType]);

  const navigator = useMemo(() => {
    return activeModule ? new QuestionNavigator(workspace, activeModule) : null;
  }, [workspace, activeModule]);

  const currentQuestion = useMemo(() => {
    return navigator?.getCurrentQuestion() || null;
  }, [navigator, workspace.session.answers]);

  const isComplete = useMemo(() => {
    return navigator?.isComplete() || false;
  }, [navigator, workspace.session.answers]);

  const progress = useMemo(() => {
    return navigator?.getProgress().percentage || 0;
  }, [navigator, workspace.session.answers]);

  const answerQuestion = useCallback((answer: any) => {
    if (navigator) {
      navigator.next(answer);
      updateWorkspace({ ...workspace }); // This triggers a save and a re-render
    }
  }, [navigator, workspace, updateWorkspace]);

  const goBack = useCallback(() => {
    if (navigator) {
      navigator.back();
      updateWorkspace({ ...workspace });
    }
  }, [navigator, workspace, updateWorkspace]);

  return (
    <SessionContext.Provider value={{ activeModule, currentQuestion, answerQuestion, goBack, isComplete, progress }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};
