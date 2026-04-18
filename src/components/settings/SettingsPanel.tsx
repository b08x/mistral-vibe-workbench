import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Select, Alert, AlertTitle, AlertDescription } from '../ui';
import { WorkspaceManager } from '../../lib/storage/workspace-manager';
import { Key, ShieldAlert, Save, Trash2, CheckCircle2 } from 'lucide-react';
import { ProviderRegistry } from '../../lib/providers/registry';

export const SettingsPanel: React.FC = () => {
  const [keys, setKeys] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const registry = ProviderRegistry.getInstance();
  const providers = registry.list();

  useEffect(() => {
    setKeys(WorkspaceManager.getAPIKeys() as Record<string, string>);
  }, []);

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
                <span className={keys[provider.id] ? "text-emerald-500" : "text-amber-500"}>
                  {keys[provider.id] ? "Configured" : "Missing"}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Input
                  type="password"
                  value={keys[provider.id] || ''}
                  onChange={(e) => setKeys({ ...keys, [provider.id]: e.target.value })}
                  placeholder={`Enter ${provider.name} API Key`}
                  className="font-mono text-sm h-10"
                />
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
