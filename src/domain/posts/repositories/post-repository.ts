import { PostEntity, PostListItem } from '../entities/post';

export interface CreatePostRepositoryInput {
  id?: string;
  title: string;
  publishedAt?: Date;
  tags: string;
  readingTime: number | null;
  description: string | null;
  content: string;
  isFixed: boolean;
}

export interface UpdatePostRepositoryInput {
  title: string;
  publishedAt: Date;
  tags: string;
  readingTime: number | null;
  description: string | null;
  content: string;
}

export interface PostRepository {
  create(data: CreatePostRepositoryInput): Promise<PostEntity>;
  count(): Promise<number>;
  findMany(params: { skip: number; take: number }): Promise<PostListItem[]>;
  findFixed(limit: number): Promise<PostListItem[]>;
  countSearch(query: string): Promise<number>;
  search(query: string, params: {skip: number; take: number}): Promise<
    Array<Pick<PostEntity, 'id' | 'title' | 'description' | 'tags' | 'publishedAt'>>
  >;
  findById(id: string): Promise<PostEntity | null>;
  update(id: string, data: UpdatePostRepositoryInput): Promise<PostEntity>;
  toggleFixed(id: string, isFixed: boolean): Promise<PostEntity>;
  delete(id: string): Promise<void>;
}
