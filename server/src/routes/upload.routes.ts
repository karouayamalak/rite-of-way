import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { uploadImageFromBuffer, deleteImage } from '../lib/cloudinary';
import { requireAdmin } from '../middleware/auth';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and WebP images are allowed'));
    }
  },
});

router.post('/image', requireAdmin, upload.single('image'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'No image file provided' });
      return;
    }

    const result = await uploadImageFromBuffer(req.file.buffer, 'rite-of-way/products');
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

router.post('/images', requireAdmin, upload.array('images', 10), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      res.status(400).json({ success: false, message: 'No image files provided' });
      return;
    }

    const results = await Promise.all(
      files.map((file) => uploadImageFromBuffer(file.buffer, 'rite-of-way/products'))
    );

    res.json({ success: true, data: results });
  } catch (error) {
    next(error);
  }
});

router.delete('/image', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { publicId } = req.body;
    if (!publicId) {
      res.status(400).json({ success: false, message: 'publicId is required' });
      return;
    }
    await deleteImage(publicId);
    res.json({ success: true, message: 'Image deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
