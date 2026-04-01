import multer from 'multer';
import path from 'path';

const storage = multer.memoryStorage();

export const uploadMarkdown = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    if (path.extname(file.originalname).toLowerCase() !== '.md') {
      return cb(new Error('Apenas arquivos .md são permitidos'));
    }

    cb(null, true);
  },
});
