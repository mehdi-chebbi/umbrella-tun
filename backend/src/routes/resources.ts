import { Router, Request, Response } from 'express';
import { readdirSync, statSync, createReadStream, existsSync } from 'fs';
import { join, parse } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const RESOURCES_DIR = join(__dirname, '..', '..', 'resources');

/* ─── Helpers ─── */
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function cleanTitle(filename: string): string {
  const name = parse(filename).name;
  // Remove leading number + dash/underscore
  return name.replace(/^\d+[-_]/, '').replace(/_/g, ' ').trim();
}

const router = Router();

/**
 * GET /api/resources
 * Scans subdirectories of resources/ — each folder is a category.
 * Returns categorized list of PDF documents.
 */
router.get('/', (_req: Request, res: Response): void => {
  try {
    if (!existsSync(RESOURCES_DIR)) {
      res.json([]);
      return;
    }

    const entries = readdirSync(RESOURCES_DIR).sort();

    const manifest: Array<{
      category: string;
      documents: Array<{
        filename: string;
        title: string;
        size: string;
        sizeBytes: number;
        url: string;
      }>;
    }> = [];

    for (const entry of entries) {
      const entryPath = join(RESOURCES_DIR, entry);
      const stat = statSync(entryPath);

      if (!stat.isDirectory()) continue;

      const files = readdirSync(entryPath)
        .filter(f => {
          const fp = join(entryPath, f);
          return statSync(fp).isFile() && f.toLowerCase().endsWith('.pdf');
        })
        .sort();

      if (files.length === 0) continue;

      const documents = files.map(file => {
        const stats = statSync(join(entryPath, file));
        return {
          filename: file,
          title: cleanTitle(file),
          size: formatSize(stats.size),
          sizeBytes: stats.size,
          url: `/api/resources/${encodeURIComponent(entry)}/${encodeURIComponent(file)}`,
        };
      });

      manifest.push({
        category: entry,
        documents,
      });
    }

    res.json(manifest);
  } catch (error) {
    console.error('Erreur lors de la lecture des ressources :', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

/**
 * GET /api/resources/:category/:filename
 * Downloads a specific PDF file from a category folder.
 */
router.get('/:category/:filename', (req: Request, res: Response): void => {
  try {
    const category = req.params.category as string;
    const filename = req.params.filename as string;
    const filePath = join(RESOURCES_DIR, category, filename);

    // Security: prevent path traversal
    const resolvedDir = join(RESOURCES_DIR, category);
    if (!filePath.startsWith(resolvedDir)) {
      res.status(403).json({ error: 'Accès refusé' });
      return;
    }

    if (!existsSync(filePath) || !statSync(filePath).isFile()) {
      res.status(404).json({ error: 'Fichier introuvable' });
      return;
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const stream = createReadStream(filePath);
    stream.pipe(res);
  } catch {
    res.status(404).json({ error: 'Fichier introuvable' });
  }
});

export default router;
