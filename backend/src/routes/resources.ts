import { Router, Request, Response, raw } from 'express';
import {
  createReadStream,
  existsSync,
  mkdirSync,
  readdirSync,
  rmdirSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from 'fs';
import { basename, dirname, join, parse, resolve, sep } from 'path';
import { fileURLToPath } from 'url';
import { authMiddleware, adminOnly } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const RESOURCES_DIR = process.env.RESOURCES_DIR || join(__dirname, '..', '..', 'resources');
const MAX_PDF_SIZE = 25 * 1024 * 1024;
const ALLOWED_CATEGORIES = new Set([
  'Études & Caractérisation',
  'Rapports NDT & UNCCD',
  'Stratégies Nationales',
]);

type ResourceDocument = {
  filename: string;
  title: string;
  size: string;
  sizeBytes: number;
  url: string;
};

type ResourceCategory = {
  category: string;
  documents: ResourceDocument[];
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function cleanTitle(filename: string): string {
  const name = parse(filename).name;
  return name.replace(/^\d+[-_]/, '').replace(/_/g, ' ').trim();
}

function isSafeSegment(value: string): boolean {
  const trimmed = value.trim();
  return (
    trimmed.length > 0 &&
    trimmed.length <= 120 &&
    trimmed !== '.' &&
    trimmed !== '..' &&
    basename(trimmed) === trimmed &&
    !trimmed.includes('/') &&
    !trimmed.includes('\\') &&
    !trimmed.includes('\0')
  );
}

function resolveInsideResources(...segments: string[]): string | null {
  const root = resolve(RESOURCES_DIR);
  const target = resolve(root, ...segments);
  return target === root || target.startsWith(`${root}${sep}`) ? target : null;
}

function readManifest(): ResourceCategory[] {
  if (!existsSync(RESOURCES_DIR)) return [];

  return readdirSync(RESOURCES_DIR)
    .sort((a, b) => a.localeCompare(b, 'fr'))
    .flatMap((entry): ResourceCategory[] => {
      const entryPath = join(RESOURCES_DIR, entry);
      if (!statSync(entryPath).isDirectory()) return [];

      const documents = readdirSync(entryPath)
        .filter((file) => {
          const filePath = join(entryPath, file);
          return statSync(filePath).isFile() && file.toLowerCase().endsWith('.pdf');
        })
        .sort((a, b) => a.localeCompare(b, 'fr'))
        .map((file): ResourceDocument => {
          const stats = statSync(join(entryPath, file));
          return {
            filename: file,
            title: cleanTitle(file),
            size: formatSize(stats.size),
            sizeBytes: stats.size,
            url: `/api/resources/${encodeURIComponent(entry)}/${encodeURIComponent(file)}`,
          };
        });

      return documents.length > 0 ? [{ category: entry, documents }] : [];
    });
}

const router = Router();

router.get('/', (_req: Request, res: Response): void => {
  try {
    res.json(readManifest());
  } catch (error) {
    console.error('Erreur lors de la lecture des ressources :', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

router.post(
  '/admin/:category/:filename',
  authMiddleware,
  adminOnly,
  raw({ type: 'application/pdf', limit: MAX_PDF_SIZE }),
  (req: Request, res: Response): void => {
    try {
      const category = (req.params.category as string).trim();
      const filename = (req.params.filename as string).trim();

      if (!isSafeSegment(category)) {
        res.status(400).json({ error: 'Nom de catégorie invalide' });
        return;
      }
      if (!ALLOWED_CATEGORIES.has(category)) {
        res.status(400).json({ error: 'Catégorie non autorisée' });
        return;
      }
      if (!isSafeSegment(filename) || !filename.toLowerCase().endsWith('.pdf')) {
        res.status(400).json({ error: 'Nom de fichier PDF invalide' });
        return;
      }
      if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
        res.status(400).json({ error: 'Fichier PDF requis' });
        return;
      }
      if (req.body.length > MAX_PDF_SIZE) {
        res.status(413).json({ error: 'Le fichier dépasse la limite de 25 Mo' });
        return;
      }
      if (req.body.subarray(0, 5).toString('ascii') !== '%PDF-') {
        res.status(400).json({ error: 'Le fichier envoyé n’est pas un PDF valide' });
        return;
      }

      const categoryPath = resolveInsideResources(category);
      const filePath = resolveInsideResources(category, filename);
      if (!categoryPath || !filePath) {
        res.status(403).json({ error: 'Accès refusé' });
        return;
      }
      if (existsSync(filePath)) {
        res.status(409).json({ error: 'Un document portant ce nom existe déjà dans cette catégorie' });
        return;
      }

      mkdirSync(categoryPath, { recursive: true });
      writeFileSync(filePath, req.body, { flag: 'wx' });

      res.status(201).json({
        message: 'Document ajouté avec succès',
        document: {
          category,
          filename,
          title: cleanTitle(filename),
          size: formatSize(req.body.length),
          sizeBytes: req.body.length,
          url: `/api/resources/${encodeURIComponent(category)}/${encodeURIComponent(filename)}`,
        },
      });
    } catch (error) {
      console.error('Erreur lors de l’ajout du document :', error);
      res.status(500).json({ error: 'Impossible d’ajouter le document' });
    }
  }
);

router.delete(
  '/admin/:category/:filename',
  authMiddleware,
  adminOnly,
  (req: Request, res: Response): void => {
    try {
      const category = (req.params.category as string).trim();
      const filename = (req.params.filename as string).trim();

      if (!isSafeSegment(category) || !isSafeSegment(filename)) {
        res.status(400).json({ error: 'Chemin de document invalide' });
        return;
      }

      const categoryPath = resolveInsideResources(category);
      const filePath = resolveInsideResources(category, filename);
      if (!categoryPath || !filePath) {
        res.status(403).json({ error: 'Accès refusé' });
        return;
      }
      if (!existsSync(filePath) || !statSync(filePath).isFile()) {
        res.status(404).json({ error: 'Document introuvable' });
        return;
      }

      unlinkSync(filePath);
      if (existsSync(categoryPath) && readdirSync(categoryPath).length === 0) {
        rmdirSync(categoryPath);
      }
      res.json({ message: 'Document supprimé avec succès' });
    } catch (error) {
      console.error('Erreur lors de la suppression du document :', error);
      res.status(500).json({ error: 'Impossible de supprimer le document' });
    }
  }
);

router.get('/:category/:filename', (req: Request, res: Response): void => {
  try {
    const category = req.params.category as string;
    const filename = req.params.filename as string;
    if (!isSafeSegment(category) || !isSafeSegment(filename)) {
      res.status(400).json({ error: 'Chemin de document invalide' });
      return;
    }

    const filePath = resolveInsideResources(category, filename);
    if (!filePath) {
      res.status(403).json({ error: 'Accès refusé' });
      return;
    }
    if (!existsSync(filePath) || !statSync(filePath).isFile()) {
      res.status(404).json({ error: 'Fichier introuvable' });
      return;
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
    createReadStream(filePath).pipe(res);
  } catch {
    res.status(404).json({ error: 'Fichier introuvable' });
  }
});

export default router;
