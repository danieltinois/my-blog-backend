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
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) =>
    cb(null, uuidv4() + path.extname(file.originalname)),
});

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    if (path.extname(file.originalname).toLowerCase() !== '.md') {
      return cb(new Error('Apenas arquivos .md são permitidos'));
    }
    cb(null, true);
  },
});

router.post('/', upload.single('file'), async (req, res) => {
  try {
    const { title, publishedAt, tags, readingTime, description, id, isFixed } =
      req.body as any;
    if (!req.file)
      return res.status(400).json({ error: 'Arquivo .md é obrigatório' });

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
        isFixed: isFixed === 'true' || isFixed === true,
      },
    });

    return res.status(201).json({ ...post, tags: tagsArray });
  } catch (err: any) {
    if (req.file) fs.unlinkSync(req.file.path);
    return res.status(500).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  const page = Math.max(1, parseInt((req.query.page as string) || '1', 10));
  const limit = Math.max(1, parseInt((req.query.limit as string) || '10', 10));
  const skip = (page - 1) * limit;

  const [total, posts] = await Promise.all([
    prisma.post.count(),
    prisma.post.findMany({
      orderBy: [{ isFixed: 'desc' }, { publishedAt: 'desc' }], // Fixados no topo
      skip,
      take: limit,
    }),
  ]);

  const list = posts.map((p: any) => ({
    ...p,
    tags: p.tags
      ? p.tags
          .split(',')
          .map((t: string) => t.trim())
          .filter(Boolean)
      : [],
  }));

  res.json({ data: list, page, limit, total });
});

router.get('/fixed-posts', async (req, res) => {
  try {
    const fixedPosts = await prisma.post.findMany({
      where: { isFixed: true },
      take: 10,
      orderBy: { publishedAt: 'desc' },
    });
    const result = fixedPosts.map(p => ({
      ...p,
      tags: p.tags
        ? p.tags
            .split(',')
            .map((t: string) => t.trim())
            .filter(Boolean)
        : [],
    }));

    return res.json({ data: result });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Rota para Alternar o status de fixado (Toggle)
router.patch('/:id/fixed', async (req, res) => {
  try {
    const id = req.params.id;
    const existing = await prisma.post.findUnique({ where: { id } });
    if (!existing)
      return res.status(404).json({ error: 'Post não encontrado' });

    const updatedPost = await prisma.post.update({
      where: { id },
      data: { isFixed: !existing.isFixed },
    });

    return res.json({
      message: updatedPost.isFixed ? 'Post fixado' : 'Post desfixado',
      post: updatedPost,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/search', async (req, res) => {
  try {
    const search = req.query.q as string;
    if (!search) {
      return res.status(400).json({ error: 'Query string is required' });
    }

    const posts = await prisma.post.findMany({
      where: {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { tags: { contains: search, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        title: true,
        description: true,
        tags: true,
      },
    });

    return res.json({ data: posts });
  } catch (err: any) {}
});

router.get('/:id', async (req, res) => {
  const post = await prisma.post.findUnique({ where: { id: req.params.id } });
  if (!post) return res.status(404).json({ error: 'Post não encontrado' });

  const mdPath = path.join(__dirname, '..', '..', post.filePath);
  const content = fs.readFileSync(mdPath, 'utf8');
  const tagsArray = post.tags
    ? post.tags
        .split(',')
        .map((t: string) => t.trim())
        .filter(Boolean)
    : [];

  return res.json({ ...post, tags: tagsArray, content });
});

router.patch('/:id', upload.single('file'), async (req, res) => {
  try {
    const id = req.params.id;
    const existing = await prisma.post.findUnique({ where: { id } });
    if (!existing)
      return res.status(404).json({ error: 'Post não encontrado' });

    let newFilePath = existing.filePath;
    if (req.file) {
      const oldPath = path.join(__dirname, '..', '..', existing.filePath);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      newFilePath = `/uploads/${req.file.filename}`;
    }

    const { title, publishedAt, tags, readingTime, description } =
      req.body as any;
    const tagsArray = tags
      ? Array.isArray(tags)
        ? tags
        : tags.split(',').map((t: string) => t.trim())
      : existing.tags.split(',');

    const updated = await prisma.post.update({
      where: { id },
      data: {
        title: title || existing.title,
        publishedAt: publishedAt ? new Date(publishedAt) : existing.publishedAt,
        tags: Array.isArray(tagsArray) ? tagsArray.join(',') : existing.tags,
        readingTime:
          readingTime !== undefined
            ? Number(readingTime)
            : existing.readingTime,
        description:
          description !== undefined ? description : existing.description,
        filePath: newFilePath,
      },
    });

    return res.json(updated);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const existing = await prisma.post.findUnique({
      where: { id: req.params.id },
    });
    if (!existing)
      return res.status(404).json({ error: 'Post não encontrado' });
    const mdPath = path.join(__dirname, '..', '..', existing.filePath);
    if (fs.existsSync(mdPath)) fs.unlinkSync(mdPath);
    await prisma.post.delete({ where: { id: req.params.id } });
    return res.status(204).send();
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
