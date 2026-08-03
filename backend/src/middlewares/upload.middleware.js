import multer from 'multer';
import { createHttpError } from '../utils/error.js';

const ALLOWED_AVATAR_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, callback) => {
    if (!ALLOWED_AVATAR_TYPES.has(file.mimetype)) {
      callback(createHttpError(400, 'Avatar must be a JPEG, PNG, or WebP image'));
      return;
    }

    callback(null, true);
  },
});

export const uploadAvatar = (req, res, next) => {
  upload.single('avatar')(req, res, (error) => {
    if (!error) {
      return next();
    }

    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
      return next(createHttpError(400, 'Avatar must be 2MB or smaller'));
    }

    return next(error.status ? error : createHttpError(400, 'Unable to upload avatar'));
  });
};
