import { PostService } from '../application/posts/post-service';
import { PrismaPostRepository } from '../infrastructure/posts/prisma-post-repository';
import { PostsController } from '../presentation/http/controllers/posts-controller';

export function makePostsController() {
  const postRepository = new PrismaPostRepository();
  const postService = new PostService(postRepository);

  return new PostsController(postService);
}
