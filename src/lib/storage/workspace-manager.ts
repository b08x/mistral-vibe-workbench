import { VibeWorkspace } from '../../types';

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

  static exportAsJSON(workspace: VibeWorkspace): string {
      return JSON.stringify(workspace, null, 2);
  }
}
