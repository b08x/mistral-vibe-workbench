import { VibeWorkspace, WorkbenchModelSettings } from '../../types';

const STORAGE_KEY = 'vibe_workspace_state';
const API_KEYS_KEY = 'vibe_api_keys';

export class WorkspaceManager {
  static save(workspace: VibeWorkspace) {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(workspace));
  }

  static load(): VibeWorkspace | null {
    const data = sessionStorage.getItem(STORAGE_KEY);
    if (!data) return null;
    
    try {
        const workspace = JSON.parse(data);
        // Correct Date types
        workspace.meta.createdAt = new Date(workspace.meta.createdAt);
        workspace.meta.lastModifiedAt = new Date(workspace.meta.lastModifiedAt);
        if (workspace.meta.generatedAt) workspace.meta.generatedAt = new Date(workspace.meta.generatedAt);
        
        return workspace;
    } catch (e) {
        console.error('Failed to parse workspace state', e);
        return null;
    }
  }

  static clear() {
    sessionStorage.removeItem(STORAGE_KEY);
  }

  static saveAPIKey(provider: string, key: string) {
    const keys = this.getAPIKeys();
    keys[provider] = key;
    sessionStorage.setItem(API_KEYS_KEY, JSON.stringify(keys));
  }

  static getAPIKey(provider: string): string | null {
    const keys = this.getAPIKeys();
    return keys[provider] || null;
  }

  static getAPIKeys(): Record<string, string> {
      const data = sessionStorage.getItem(API_KEYS_KEY);
      if (!data) return {};
      try {
          return JSON.parse(data);
      } catch (e) {
          return {};
      }
  }

  static clearAPIKeys() {
      sessionStorage.removeItem(API_KEYS_KEY);
  }

  static saveModelSettings(settings: WorkbenchModelSettings): void {
    const toSave = { phase_models: settings.phase_models };
    localStorage.setItem('vibe_model_settings', JSON.stringify(toSave));
  }

  static loadModelSettings(): { phase_models: WorkbenchModelSettings['phase_models'] } | null {
    const raw = localStorage.getItem('vibe_model_settings');
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  }

  static getAllAPIKeys(): Record<string, string> {
    // If we're using the single-key approach:
    return this.getAPIKeys();
    
    /* 
    // If we were using the multi-key approach from the prompt:
    const keys: Record<string, string> = {}
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i)
      if (k?.startsWith('vibe_api_key_')) {
        const providerId = k.replace('vibe_api_key_', '')
        keys[providerId] = sessionStorage.getItem(k) || ''
      }
    }
    return keys 
    */
  }

  static exportAsJSON(workspace: VibeWorkspace): string {
      return JSON.stringify(workspace, null, 2);
  }
}
