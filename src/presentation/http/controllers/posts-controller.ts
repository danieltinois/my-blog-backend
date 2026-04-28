import { Request, Response } from 'express';
import { PostService } from '../../../application/posts/post-service';
import { AppError } from '../../../shared/errors/app-error';

interface CreatePostRequestBody {
  title: string;
  publishedAt?: string;
  tags?: string | string[];
  readingTime?: string | number;
  description?: string;
  id?: string;
  isFixed?: string | boolean;
}

interface UpdatePostRequestBody {
  title?: string;
  publishedAt?: string;
  tags?: string | string[];
  readingTime?: string | number;
  description?: string | null;
}

export class PostsController {
  constructor(private readonly postService: PostService) {}

  create = async (req: Request, res: Response) => {
    return this.handle(res, async () => {
      const body = req.body as CreatePostRequestBody;
      const post = await this.postService.create({
        ...body,
        fileContent: req.file?.buffer.toString('utf8'),
      });

      return res.status(201).json(post);
    });
  };

  list = async (req: Request, res: Response) => {
    return this.handle(res, async () => {
      const page = parseInt((req.query.page as string) || '1', 10);
      const limit = parseInt((req.query.limit as string) || '10', 10);
      const response = await this.postService.list(page, limit);

      return res.json(response);
    });
  };

  listFixed = async (_req: Request, res: Response) => {
    return this.handle(res, async () => {
      const response = await this.postService.listFixed();
      return res.json(response);
    });
  };

  toggleFixed = async (req: Request, res: Response) => {
    return this.handle(res, async () => {
      const response = await this.postService.toggleFixed(req.params.id);
      return res.json(response);
    });
  };

  search = async (req: Request, res: Response) => {
    return this.handle(res, async () => {
      const page = parseInt((req.query.page as string) || '1', 10);
      const limit = parseInt((req.query.limit as string) || '10', 10);
      const response = await this.postService.search(
          req.query.q as string | undefined,
          page,
          limit
      );

      return res.json(response);
    });
  };

  getById = async (req: Request, res: Response) => {
    return this.handle(res, async () => {
      const post = await this.postService.getById(req.params.id);
      return res.json(post);
    });
  };

  update = async (req: Request, res: Response) => {
    return this.handle(res, async () => {
      const body = req.body as UpdatePostRequestBody;
      const post = await this.postService.update({
        id: req.params.id,
        ...body,
        fileContent: req.file?.buffer.toString('utf8'),
      });

      return res.json(post);
    });
  };

  delete = async (req: Request, res: Response) => {
    return this.handle(res, async () => {
      await this.postService.delete(req.params.id);
      return res.status(204).send();
    });
  };

  private async handle(
    res: Response,
    action: () => Promise<Response>
  ): Promise<Response> {
    try {
      return await action();
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message });
      }

      const message =
        error instanceof Error ? error.message : 'Erro interno do servidor';

      return res.status(500).json({ error: message });
    }
  }
}
