import { PrismaClient } from '@prisma/client';
import express from 'express';
import fs from 'fs';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();
const router = express.Router();

const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads');

fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, UPLOADS_DIR);
  },
  filename: function (_req, file, cb) {
    const id = uuidv4();
    const ext = path.extname(file.originalname);
    cb(null, id + ext);
  },
});

const upload = multer({
  storage,
  fileFilter: function (_req, file, cb) {
    if (path.extname(file.originalname).toLowerCase() !== '.md') {
      return cb(new Error('Apenas arquivos .md são permitidos'));
    }
    cb(null, true);
  },
});

// Create post
router.post('/', upload.single('file'), async (req, res) => {
  try {
    const { title, publishedAt, tags, readingTime, description, id } =
      req.body as any;
    if (!req.file)
      return res.status(400).json({ error: 'Arquivo .md é obrigatório' });

    if (!title)
      return (
        fs.unlinkSync(req.file.path),
        res.status(400).json({ error: 'Título é obrigatório' })
      );

    if (!tags) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Tag é obrigatória' });
    }

    if (!readingTime) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Tempo de leitura é obrigatório' });
    }

    if (!description) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Descrição é obrigatória' });
    }

    const tagsArray = tags
      ? Array.isArray(tags)
        ? tags
        : tags.split(',').map((t: string) => t.trim())
      : [];
    const post = await prisma.post.create({
      data: {
        id: id || undefined,
        title,
        publishedAt: publishedAt ? new Date(publishedAt) : undefined,
        tags: tagsArray.join(','),
        readingTime: readingTime ? Number(readingTime) : null,
        description: description || null,
        filePath: `/uploads/${req.file.filename}`,
      },
    });

    const result = { ...post, tags: tagsArray };
    return res.status(201).json(result);
  } catch (err: any) {
    // delete uploaded file
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

// Read post with all info
router.get('/:id', async (req, res) => {
  const post = await prisma.post.findUnique({ where: { id: req.params.id } });
  if (!post) return res.status(404).json({ error: 'Post não encontrado' });

  const mdPath = path.join(__dirname, '..', '..', post.filePath);
  let content: string | null = null;
  try {
    content = fs.readFileSync(mdPath, 'utf8');
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Erro ao ler o arquivo' });
  }

  const tagsArray = post.tags
    ? post.tags
        .split(',')
        .map((t: string) => t.trim())
        .filter(Boolean)
    : [];

  return res.json({ ...post, tags: tagsArray, content });
});

// Find all (limited fields) with pagination
router.get('/', async (req: express.Request, res: express.Response) => {
  const page = Math.max(1, parseInt((req.query.page as string) || '1', 10));
  const limit = Math.max(1, parseInt((req.query.limit as string) || '10', 10));
  const skip = (page - 1) * limit;

  const [total, posts] = await Promise.all([
    prisma.post.count(),
    prisma.post.findMany({
      orderBy: { publishedAt: 'desc' },
      skip,
      take: limit,
    }),
  ]);

  const list = posts.map((p: any) => ({
    id: p.id,
    title: p.title,
    publishedAt: p.publishedAt,
    tags: p.tags
      ? p.tags
          .split(',')
          .map((t: string) => t.trim())
          .filter(Boolean)
      : [],
    description: p.description,
  }));

  res.json({ data: list, page, limit, total });
});

// Update post (metadata and optional file replacement)
router.patch(
  '/:id',
  upload.single('file'),
  async (req: express.Request, res: express.Response) => {
    try {
      const { title, publishedAt, tags, readingTime, description } =
        req.body as any;
      const id = req.params.id;

      const existing = await prisma.post.findUnique({ where: { id } });
      if (!existing)
        return res.status(404).json({ error: 'Post não encontrado' });

      // handle file replacement
      let newFilePath = existing.filePath;
      if (req.file) {
        const oldPath = path.join(__dirname, '..', '..', existing.filePath);
        try {
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        } catch (e) {
          // ignore unlink errors
        }
        newFilePath = `/uploads/${req.file.filename}`;
      }

      const tagsArray = tags
        ? Array.isArray(tags)
          ? tags
          : tags.split(',').map((t: string) => t.trim())
        : existing.tags
          ? existing.tags
              .split(',')
              .map((t: string) => t.trim())
              .filter(Boolean)
          : [];

      const updated = await prisma.post.update({
        where: { id },
        data: {
          title: title || existing.title,
          publishedAt: publishedAt
            ? new Date(publishedAt)
            : existing.publishedAt,
          tags: tagsArray.join(','),
          readingTime:
            readingTime !== undefined
              ? Number(readingTime)
              : existing.readingTime,
          description:
            description !== undefined ? description : existing.description,
          filePath: newFilePath,
        },
      });

      return res.json({ ...updated, tags: tagsArray });
    } catch (err: any) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
  }
);

// Delete post and its markdown file
router.delete('/:id', async (req: express.Request, res: express.Response) => {
  try {
    const id = req.params.id;
    const existing = await prisma.post.findUnique({ where: { id } });
    if (!existing)
      return res.status(404).json({ error: 'Post não encontrado' });

    // delete file
    const mdPath = path.join(__dirname, '..', '..', existing.filePath);
    try {
      if (fs.existsSync(mdPath)) fs.unlinkSync(mdPath);
    } catch (e) {
      // ignore unlink errors
    }

    await prisma.post.delete({ where: { id } });
    return res.status(204).send();
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
