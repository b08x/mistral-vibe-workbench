import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Select, Alert, AlertTitle, AlertDescription } from '../ui';
import { WorkspaceManager } from '../../lib/storage/workspace-manager';
import { Key, ShieldAlert, Save, Trash2, CheckCircle2, RefreshCw } from 'lucide-react';
import { useModelValidation } from '../../hooks/useModelValidation';

export const SettingsPanel: React.FC = () => {
  const [keys, setKeys] = useState<Record<string, string>>({});
  const [serverStatus, setServerStatus] = useState<Record<string, 'configured' | 'missing'>>({});
  const [saved, setSaved] = useState(false);
  const { validateKey, keyStatus } = useModelValidation();

  // Static list for UI (matching ProviderRegistry fallback)
  const providers = [
    { id: 'anthropic', name: 'Anthropic', supportsDirectBrowser: false },
    { id: 'openai', name: 'OpenAI', supportsDirectBrowser: false },
    { id: 'mistral', name: 'Mistral', supportsDirectBrowser: false },
    { id: 'openrouter', name: 'OpenRouter', supportsDirectBrowser: true },
    { id: 'google', name: 'Google / Gemini', supportsDirectBrowser: true },
  ];

  useEffect(() => {
    const loadedKeys = WorkspaceManager.getAPIKeys() as Record<string, string>;
    setKeys(loadedKeys);
    
    // Check server status
    fetch('/api/providers/status')
      .then(res => res.json())
      .then(setServerStatus)
      .catch(err => console.error('Failed to fetch server provider status', err));

    // Auto-validate configured keys on load
    Object.entries(loadedKeys).forEach(([id, key]) => {
      if (key && key.length > 5) {
        validateKey(id, key);
      }
    });

    // Also auto-validate server-side keys
    providers.forEach(p => {
      if (!loadedKeys[p.id]) {
        validateKey(p.id, ''); // Try validating with server key
      }
    });
  }, []);

  const getStatusLabel = (providerId: string) => {
    const status = keyStatus[providerId] ?? 'unset';
    const isServerConfigured = serverStatus[providerId] === 'configured';
    
    if (status === 'validating') return { label: 'Checking...', color: 'text-blue-400' };
    if (status === 'valid')      return { label: 'Active ✓',     color: 'text-emerald-500' };
    
    if (isServerConfigured) return { label: 'Server Configured', color: 'text-emerald-400' };
    
    if (keys[providerId] && status === 'unset') return { label: 'Configured (Client)', color: 'text-amber-500' };

    switch (status) {
      case 'invalid':    return { label: 'Invalid Key', color: 'text-red-500' };
      default:           return { label: 'Missing',     color: 'text-amber-500 opacity-50' };
    }
  };

  const handleSave = () => {
    Object.entries(keys).forEach(([provider, key]) => {
      WorkspaceManager.saveAPIKey(provider, key as string);
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClear = () => {
    WorkspaceManager.clearAPIKeys();
    setKeys({});
  };

  return (
    <div className="max-w-3xl mx-auto py-12 px-6">
      <header className="mb-12">
        <h1 className="text-3xl font-bold mb-4 flex items-center gap-3 tracking-tight uppercase">
          <Key className="w-8 h-8 text-primary" /> Workbench Settings
        </h1>
        <p className="text-muted-foreground">Configure model providers and API keys for artifact generation.</p>
      </header>

      <Alert variant="destructive" className="mb-8">
        <ShieldAlert className="w-4 h-4" />
        <AlertTitle>Security Warning</AlertTitle>
        <AlertDescription className="text-xs">
          API keys are stored in <strong>sessionStorage only</strong>. They will be wiped when you close the tab or browser. 
          Never share these keys. Use OpenRouter for the most browser-compatible CORS experience.
        </AlertDescription>
      </Alert>

      <div className="space-y-6">
        {providers.map((provider) => (
          <Card key={provider.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center justify-between">
                <span>{provider.name} {provider.supportsDirectBrowser && <span className="ml-2 px-1.5 py-0.5 rounded bg-emerald-500 text-white text-[10px]">CORS SAFE</span>}</span>
                <span className={getStatusLabel(provider.id).color}>
                  {getStatusLabel(provider.id).label}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Input
                  type="password"
                  value={keys[provider.id] || ''}
                  onChange={(e) => setKeys({ ...keys, [provider.id]: e.target.value })}
                  onBlur={() => {
                    if (keys[provider.id] && keys[provider.id].length > 10) {
                      WorkspaceManager.saveAPIKey(provider.id, keys[provider.id]);
                      validateKey(provider.id, keys[provider.id]);
                    }
                  }}
                  placeholder={`Enter ${provider.name} API Key`}
                  className="font-mono text-sm h-10"
                />
                {keyStatus[provider.id] === 'valid' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => validateKey(provider.id, keys[provider.id])}
                    className="shrink-0 h-10"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" /> Refresh Models
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        <div className="flex justify-between items-center pt-8 border-t">
          <Button variant="ghost" onClick={handleClear} className="text-destructive h-10">
            <Trash2 className="w-4 h-4 mr-2" /> Clear All Keys
          </Button>
          <Button size="lg" onClick={handleSave} className="h-10">
            {saved ? <CheckCircle2 className="w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            {saved ? 'Keys Saved' : 'Save Configurations'}
          </Button>
        </div>
      </div>
    </div>
  );
};
