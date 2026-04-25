import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import { ProviderRegistry } from './src/lib/providers/registry.ts';
import { GenerationOrchestrator } from './src/lib/generation/orchestrator.ts';
import { SkeletonOrchestrator } from './src/lib/generation/skeleton-orchestrator.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to get server-side API keys (TASK-1.2)
function getServerKeys(): Record<string, string> {
  return {
    anthropic: process.env.ANTHROPIC_API_KEY || '',
    openai: process.env.OPENAI_API_KEY || '',
    mistral: process.env.MISTRAL_API_KEY || '',
    openrouter: process.env.OPENROUTER_API_KEY || '',
    google: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || '',
  };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', environment: process.env.NODE_ENV || 'development' });
  });

  // Provider Check (TASK-1.2)
  app.get('/api/providers/status', (req, res) => {
    const keys = getServerKeys();
    const status: Record<string, 'configured' | 'missing'> = {};
    for (const [provider, key] of Object.entries(keys)) {
      status[provider] = key ? 'configured' : 'missing';
    }
    res.json(status);
  });

  app.post('/api/providers/validate', async (req, res) => {
    try {
      const { providerId, apiKey } = req.body;
      const keys = getServerKeys();
      const actualKey = apiKey || keys[providerId as keyof typeof keys];

      if (!actualKey) {
        return res.status(400).json({ status: 'invalid', models: [], error: 'No API key provided or configured on server' });
      }

      const result = await ProviderRegistry.getInstance().validateAndFetch(providerId, actualKey);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ status: 'invalid', models: [], error: error.message });
    }
  });

  // Secure Generation Proxy (TASK-1.3)
  app.post('/api/generate/artifact', async (req, res) => {
    try {
      const { workspace, targetPhase } = req.body;
      if (!workspace) return res.status(400).json({ error: 'Missing workspace state' });

      const orchestrator = new GenerationOrchestrator(workspace, getServerKeys());
      const updatedWorkspace = await orchestrator.generate(targetPhase);
      
      res.json(updatedWorkspace);
    } catch (error: any) {
      console.error('[SERVER] Artifact generation failed:', error);
      res.status(500).json({ error: error.message || 'Internal server error during generation' });
    }
  });

  app.post('/api/generate/skeleton', async (req, res) => {
    try {
      const { workspace } = req.body;
      if (!workspace) return res.status(400).json({ error: 'Missing workspace state' });

      const draftingConfig = workspace.workbench_settings.phase_models.drafting;
      const provider = ProviderRegistry.getInstance().get(draftingConfig.provider);
      const keys = getServerKeys();
      const apiKey = keys[draftingConfig.provider as keyof typeof keys] || keys.google; // Fallback to google/gemini

      if (!provider || !apiKey) {
        throw new Error(`Missing provider or API key for Drafting phase (Provider: ${draftingConfig.provider})`);
      }

      const orchestrator = new SkeletonOrchestrator(workspace, provider, apiKey);
      const preview = await orchestrator.generate();
      
      res.json(preview);
    } catch (error: any) {
      console.error('[SERVER] Skeleton planning failed:', error);
      res.status(500).json({ error: error.message || 'Internal server error during planning' });
    }
  });

  // Vite integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SERVER] Mistral-Vibe Workbench running at http://localhost:${PORT}`);
    console.log(`[SERVER] Mode: ${process.env.NODE_ENV || 'development'}`);
  });
}

startServer();
