import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { query } from './db/connection.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import contentRoutes from './routes/content.js';
import chatRoutes from './routes/chat.js';
import layerRoutes from './routes/layers.js';
import groupRoutes from './routes/groups.js';
import clipRoutes from './routes/clip.js';
import resourceRoutes from './routes/resources.js';
import reportRoutes from './routes/reports.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '4000', 10);

// ─── Security & Middleware ──────────────────────────────────────────────
app.use(helmet());

const frontendUrl = process.env.FRONTEND_URL;
if (frontendUrl) {
  app.use(cors({
    origin: frontendUrl,
    credentials: true,
  }));
} else {
  app.use(cors());
}

app.use(express.json({ limit: '10mb' }));

// ─── Routes ─────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/layers', layerRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/clip', clipRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/reports', reportRoutes);

// ─── Static file serving for clipped rasters (TIFF downloads) ───────────
// Clip-service writes .tif files to CLIP_OUTPUT_DIR (default /data/clipped-rasters).
// The /api/clip/country endpoint returns downloadUrl: /files/{layerName}/{fileId}.tif
// which is served here. Helmet's crossOriginResourcePolicy would block image/tiff
// fetches from a different origin, so we relax it for this route.
app.use(
  '/files',
  (_req: express.Request, res: express.Response, next: express.NextFunction) => {
    res.removeHeader('Cross-Origin-Resource-Policy');
    next();
  },
  express.static(process.env.CLIP_OUTPUT_DIR || '/data/clipped-rasters', {
    fallthrough: true,
    setHeaders: (res) => res.removeHeader('Cross-Origin-Resource-Policy'),
  })
);

// ─── Health Check ───────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// ─── 404 Handler ────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route non trouvée' });
});

// ─── Global Error Handler ───────────────────────────────────────────────
app.use((err: Error & { status?: number; statusCode?: number; type?: string }, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Erreur non gérée :', err);
  if (err.type === 'entity.too.large' || err.status === 413 || err.statusCode === 413) {
    res.status(413).json({ error: 'Le fichier dépasse la limite de 25 Mo' });
    return;
  }
  res.status(500).json({ error: 'Erreur interne du serveur' });
});

// ─── Database Initialization & Server Start ─────────────────────────────
async function initializeDatabase(): Promise<void> {
  try {
    const initSqlPath = join(__dirname, 'db', 'init.sql');
    const initSql = readFileSync(initSqlPath, 'utf-8');

    await query(initSql);
    console.log('✅ Base de données initialisée avec succès');
  } catch (error) {
    console.error('⚠️  Erreur lors de l\'initialisation de la base de données :', error);
    // Don't exit — the tables might already exist
  }
}

async function start(): Promise<void> {
  await initializeDatabase();

  app.listen(PORT, () => {
    console.log(`🚀 Umbrella Backend démarré sur le port ${PORT}`);
  });
}

start();
