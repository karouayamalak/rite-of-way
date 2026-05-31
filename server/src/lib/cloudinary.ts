import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface UploadResult {
  url: string;
  publicId: string;
  width: number;
  height: number;
}

const isCloudinaryConfigured = (): boolean => {
  const name = process.env.CLOUDINARY_CLOUD_NAME;
  const key = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;
  
  return !!(
    name && 
    key && 
    secret && 
    name !== 'your_cloud_name' && 
    key !== 'your_api_key' && 
    secret !== 'your_api_secret'
  );
};

const saveToLocalUploads = (buffer: Buffer): UploadResult => {
  const uploadsDir = path.join(__dirname, '../../public/uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  
  const filename = `${crypto.randomBytes(16).toString('hex')}.jpg`;
  const filePath = path.join(uploadsDir, filename);
  fs.writeFileSync(filePath, buffer);
  
  const serverUrl = process.env.SERVER_URL || `http://localhost:${process.env.PORT || 5000}`;
  const url = `${serverUrl}/uploads/${filename}`;
  
  return {
    url,
    publicId: `local_${filename}`,
    width: 1200,
    height: 1600,
  };
};

export const uploadImageFromBuffer = (
  buffer: Buffer,
  folder = 'rite-of-way/products'
): Promise<UploadResult> => {
  if (!isCloudinaryConfigured()) {
    console.log('⚠️ Cloudinary is not configured. Falling back to local file upload.');
    try {
      const result = saveToLocalUploads(buffer);
      return Promise.resolve(result);
    } catch (err: any) {
      return Promise.reject(new Error(`Local upload failed: ${err.message}`));
    }
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        transformation: [
          { width: 1200, height: 1600, crop: 'limit' },
          { quality: 'auto:good', fetch_format: 'auto' },
        ],
      },
      (error, result) => {
        if (error || !result) {
          console.warn('⚠️ Cloudinary upload failed. Trying local upload fallback...', error);
          try {
            const localResult = saveToLocalUploads(buffer);
            resolve(localResult);
          } catch (localErr: any) {
            reject(error || new Error('Cloudinary upload failed and local fallback failed too'));
          }
        } else {
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            width: result.width,
            height: result.height,
          });
        }
      }
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

export const deleteImage = async (publicId: string): Promise<void> => {
  if (publicId.startsWith('local_')) {
    const filename = publicId.replace('local_', '');
    const filePath = path.join(__dirname, '../../public/uploads', filename);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        console.log(`✓ Deleted local image: ${filename}`);
      } catch (err: any) {
        console.error(`Failed to delete local image ${filename}:`, err.message);
      }
    }
    return;
  }
  await cloudinary.uploader.destroy(publicId);
};

export { cloudinary };
