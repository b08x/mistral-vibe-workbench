import { useState, useCallback, useEffect, useRef } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { SkeletonOrchestrator, SkeletonGenerationError } from '../lib/generation/skeleton-orchestrator';
import { ProviderRegistry } from '../lib/providers/registry';
import { WorkspaceManager } from '../lib/storage/workspace-manager';
import { ComponentPreview, PreviewSection } from '../types';

export function useSkeletonGeneration() {
  const { workspace, updateWorkspace } = useWorkspace();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawResponse, setRawResponse] = useState<string | null>(null);
  
  const hasTriggered = useRef(false);

  const generateSkeleton = useCallback(async () => {
    if (isGenerating) return;
    
    setIsGenerating(true);
    setError(null);
    setRawResponse(null);

    try {
      const draftingConfig = workspace.workbench_settings.phase_models.drafting;
      const apiKeys = WorkspaceManager.getAllAPIKeys();
      const apiKey = apiKeys[draftingConfig.provider];
      
      const provider = ProviderRegistry.getInstance().get(draftingConfig.provider);
      
      if (!provider || !apiKey) {
        throw new Error(`Missing provider or API key for Drafting phase (Provider: ${draftingConfig.provider})`);
      }

      const orchestrator = new SkeletonOrchestrator(workspace, provider, apiKey);
      const preview = await orchestrator.generate();
      
      updateWorkspace({
        artifacts: {
          ...workspace.artifacts,
          componentPreview: preview
        }
      });
    } catch (err: any) {
      console.error('Skeleton generation failed:', err);
      setError(err.message || 'An unknown error occurred during skeleton generation.');
      if (err instanceof SkeletonGenerationError) {
        setRawResponse(err.rawResponse);
      }
    } finally {
      setIsGenerating(false);
    }
  }, [workspace, updateWorkspace]);

  // Auto-trigger on mount if we're in the right status and don't have a preview yet
  useEffect(() => {
    if (workspace.meta.status === 'component-preview' && !workspace.artifacts.componentPreview && !isGenerating && !hasTriggered.current && !error) {
      hasTriggered.current = true;
      generateSkeleton();
    }
  }, [workspace.meta.status, workspace.artifacts.componentPreview, isGenerating, generateSkeleton, error]);

  const updateSection = useCallback((sectionId: string, changes: Partial<PreviewSection>) => {
    const preview = workspace.artifacts.componentPreview;
    if (!preview) return;

    const sections = preview.sections.map(s => 
      s.id === sectionId ? { ...s, ...changes } : s
    );

    updateWorkspace({
      artifacts: {
        ...workspace.artifacts,
        componentPreview: { ...preview, sections }
      }
    });
  }, [workspace, updateWorkspace]);

  const removeSection = useCallback((sectionId: string) => {
    const preview = workspace.artifacts.componentPreview;
    if (!preview) return;

    const sections = preview.sections.filter(s => s.id !== sectionId || !s.editable);

    updateWorkspace({
      artifacts: {
        ...workspace.artifacts,
        componentPreview: { ...preview, sections }
      }
    });
  }, [workspace, updateWorkspace]);

  const reorderSections = useCallback((newOrderIds: string[]) => {
    const preview = workspace.artifacts.componentPreview;
    if (!preview) return;

    const sections = [...preview.sections].sort((a, b) => {
      const indexA = newOrderIds.indexOf(a.id);
      const indexB = newOrderIds.indexOf(b.id);
      return indexA - indexB;
    }).map((s, i) => ({ ...s, order: i }));

    updateWorkspace({
      artifacts: {
        ...workspace.artifacts,
        componentPreview: { ...preview, sections }
      }
    });
  }, [workspace, updateWorkspace]);

  const addSection = useCallback((label: string, description: string) => {
    const preview = workspace.artifacts.componentPreview;
    if (!preview) return;

    const newSection: PreviewSection = {
      id: crypto.randomUUID(),
      label,
      description,
      dimensionHints: {},
      editable: true,
      order: preview.sections.length
    };

    updateWorkspace({
      artifacts: {
        ...workspace.artifacts,
        componentPreview: {
          ...preview,
          sections: [...preview.sections, newSection]
        }
      }
    });
  }, [workspace, updateWorkspace]);

  const approveAndProceed = useCallback(() => {
    const preview = workspace.artifacts.componentPreview;
    if (!preview) return;

    updateWorkspace({
      meta: { ...workspace.meta, status: 'generating' },
      artifacts: {
        ...workspace.artifacts,
        componentPreview: { ...preview, userApproved: true }
      }
    });
  }, [workspace, updateWorkspace]);

  return {
    isGenerating,
    error,
    rawResponse,
    preview: workspace.artifacts.componentPreview,
    retry: generateSkeleton,
    updateSection,
    removeSection,
    reorderSections,
    addSection,
    approveAndProceed
  };
}
