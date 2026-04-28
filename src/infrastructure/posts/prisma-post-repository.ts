import { prisma } from '../../shared/database/prisma';
import {
  CreatePostRepositoryInput,
  PostRepository,
  UpdatePostRepositoryInput,
} from '../../domain/posts/repositories/post-repository';

export class PrismaPostRepository implements PostRepository {
  create(data: CreatePostRepositoryInput) {
    return prisma.post.create({ data });
  }

  count() {
    return prisma.post.count();
  }

  findMany(params: { skip: number; take: number }) {
    return prisma.post.findMany({
      orderBy: [{ isFixed: 'desc' }, { publishedAt: 'desc' }],
      skip: params.skip,
      take: params.take,
      select: {
        id: true,
        title: true,
        publishedAt: true,
        tags: true,
        readingTime: true,
        description: true,
        isFixed: true,
      },
    });
  }

  findFixed(limit: number) {
    return prisma.post.findMany({
      where: { isFixed: true },
      take: limit,
      orderBy: { publishedAt: 'desc' },
      select: {
        id: true,
        title: true,
        publishedAt: true,
        tags: true,
        readingTime: true,
        description: true,
        isFixed: true,
      },
    });
  }

  search(query: string) {
    return prisma.post.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { tags: { contains: query, mode: 'insensitive' } },
        ],
      },
      orderBy: {publishedAt: 'desc'},
      select: {
        id: true,
        title: true,
        publishedAt: true,
        description: true,
        tags: true,
      },
    });
  }

  findById(id: string) {
    return prisma.post.findUnique({ where: { id } });
  }

  update(id: string, data: UpdatePostRepositoryInput) {
    return prisma.post.update({
      where: { id },
      data,
    });
  }

  toggleFixed(id: string, isFixed: boolean) {
    return prisma.post.update({
      where: { id },
      data: { isFixed },
    });
  }

  async delete(id: string) {
    await prisma.post.delete({ where: { id } });
  }
}
