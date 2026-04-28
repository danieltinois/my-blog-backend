import { AppError } from '../../shared/errors/app-error';
import { PostRepository } from '../../domain/posts/repositories/post-repository';
import { PostTagInput } from '../../domain/posts/entities/post';
import { mapPostEntity, mapPostListItem, parseTags, serializeTags } from './post-mapper';

interface CreatePostInput {
  title: string;
  publishedAt?: string;
  tags?: PostTagInput;
  readingTime?: string | number;
  description?: string;
  id?: string;
  isFixed?: string | boolean;
  fileContent?: string;
}

interface UpdatePostInput {
  id: string;
  title?: string;
  publishedAt?: string;
  tags?: PostTagInput;
  readingTime?: string | number;
  description?: string | null;
  fileContent?: string;
}

export class PostService {
  constructor(private readonly postRepository: PostRepository) {}

  async create(input: CreatePostInput) {
    if (!input.fileContent) {
      throw new AppError('Arquivo .md é obrigatório');
    }

    const tags = parseTags(input.tags);
    const post = await this.postRepository.create({
      id: input.id || undefined,
      title: input.title,
      publishedAt: input.publishedAt ? new Date(input.publishedAt) : undefined,
      tags: serializeTags(tags),
      readingTime: this.parseReadingTime(input.readingTime),
      description: input.description || null,
      content: input.fileContent,
      isFixed: input.isFixed === 'true' || input.isFixed === true,
    });

    return mapPostEntity(post);
  }

  async list(page: number, limit: number) {
    const safePage = Math.max(1, page);
    const safeLimit = Math.max(1, limit);
    const skip = (safePage - 1) * safeLimit;

    const [total, posts] = await Promise.all([
      this.postRepository.count(),
      this.postRepository.findMany({ skip, take: safeLimit }),
    ]);

    return {
      data: posts.map(mapPostListItem),
      page: safePage,
      limit: safeLimit,
      total,
    };
  }

  async listFixed(limit = 10) {
    const posts = await this.postRepository.findFixed(limit);

    return {
      data: posts.map(mapPostListItem),
    };
  }

  async search(query: string | undefined, page: number, limit: number) {
    if (!query) {
      throw new AppError('Query string is required');
    }

    const safePage = Math.max(1, page);
    const safeLimit = Math.max(1, limit);
    const skip = (safePage - 1) * safeLimit;

    const [total, posts] = await Promise.all([
      this.postRepository.countSearch(query),
      this.postRepository.search(query, { skip, take: safeLimit }),
    ]);

    return {
      data: posts,
      page: safePage,
      limit: safeLimit,
      total,
    };
  }

  async getById(id: string) {
    const post = await this.postRepository.findById(id);

    if (!post) {
      throw new AppError('Post não encontrado', 404);
    }

    return mapPostEntity(post);
  }

  async update(input: UpdatePostInput) {
    const existing = await this.postRepository.findById(input.id);

    if (!existing) {
      throw new AppError('Post não encontrado', 404);
    }

    const tags = input.tags ? parseTags(input.tags) : parseTags(existing.tags);

    return this.postRepository.update(input.id, {
      title: input.title || existing.title,
      publishedAt: input.publishedAt
        ? new Date(input.publishedAt)
        : existing.publishedAt,
      tags: serializeTags(tags),
      readingTime:
        input.readingTime !== undefined
          ? this.parseReadingTime(input.readingTime)
          : existing.readingTime,
      description:
        input.description !== undefined ? input.description : existing.description,
      content: input.fileContent || existing.content,
    });
  }

  async toggleFixed(id: string) {
    const existing = await this.postRepository.findById(id);

    if (!existing) {
      throw new AppError('Post não encontrado', 404);
    }

    const post = await this.postRepository.toggleFixed(id, !existing.isFixed);

    return {
      message: post.isFixed ? 'Post fixado' : 'Post desfixado',
      post,
    };
  }

  async delete(id: string) {
    const existing = await this.postRepository.findById(id);

    if (!existing) {
      throw new AppError('Post não encontrado', 404);
    }

    await this.postRepository.delete(id);
  }

  private parseReadingTime(value?: string | number) {
    if (value === undefined || value === null || value === '') {
      return null;
    }

    return Number(value);
  }
}
