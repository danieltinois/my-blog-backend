export type PostTagInput = string | string[] | undefined;

export interface PostListItem {
  id: string;
  title: string;
  publishedAt: Date;
  tags: string;
  readingTime: number | null;
  description: string | null;
  isFixed: boolean;
}

export interface PostEntity extends PostListItem {
  content: string;
}
