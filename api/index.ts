import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createApp } from '../server/src/app.js';

const app = createApp();

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Normalize req.url so Express routes matching /api/* are always hit
  if (req.url && !req.url.startsWith('/api') && !req.url.startsWith('/docs')) {
    req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
  }
  return app(req as any, res as any);
}
