import { PostEntity, PostListItem, PostTagInput } from '../../domain/posts/entities/post';

export function parseTags(tags: PostTagInput): string[] {
  if (!tags) {
    return [];
  }

  if (Array.isArray(tags)) {
    return tags.map(tag => tag.trim()).filter(Boolean);
  }

  return tags
    .split(',')
    .map(tag => tag.trim())
    .filter(Boolean);
}

export function serializeTags(tags: string[]): string {
  return tags.join(',');
}

export function mapPostListItem(post: PostListItem) {
  return {
    ...post,
    tags: parseTags(post.tags),
  };
}

export function mapPostEntity(post: PostEntity) {
  return {
    ...post,
    tags: parseTags(post.tags),
  };
}
