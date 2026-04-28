import express from 'express';
import { makePostsController } from '../main/posts-factory';
import { uploadMarkdown } from '../presentation/http/middlewares/upload-markdown';

const router = express.Router();
const postsController = makePostsController();

router.post('/', uploadMarkdown.single('file'), postsController.create);
router.get('/', postsController.list);
router.get('/fixed-posts', postsController.listFixed);
router.patch('/:id/fixed', postsController.toggleFixed);
router.get('/search', postsController.search);
router.get('/:id', postsController.getById);
router.patch('/:id', uploadMarkdown.single('file'), postsController.update);
router.delete('/:id', postsController.delete);

export default router;
