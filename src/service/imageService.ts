import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

config();

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    sessionToken: process.env.AWS_SESSION_TOKEN!
  }
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME!;
const IMAGES_FOLDER = process.env.S3_IMAGES_FOLDER || 'images/';
const ALLOWED_TYPES = process.env.ALLOWED_FILE_TYPES?.split(',') || [
  'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'
];
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '5242880'); 

export interface UploadImageResult {
  success: boolean;
  imageUrl?: string | null;
  imageKey?: string | null;
  error?: string;
}

export interface ImageMetadata {
  originalName: string;
  mimeType: string;
  size: number;
  uploadedAt: Date;
}

export class ImageService {
  static validateImage(file: Express.Multer.File): { valid: boolean; error?: string } {
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      return {
        valid: false,
        error: `Tipo de archivo no permitido. Tipos válidos: ${ALLOWED_TYPES.join(', ')}`
      };
    }

    if (file.size > MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `Archivo demasiado grande. Tamaño máximo: ${MAX_FILE_SIZE / 1024 / 1024}MB`
      };
    }

    return { valid: true };
  }
  
  static generateImageKey(originalName: string): string {
    const extension = path.extname(originalName);
    const uniqueName = `${uuidv4()}${extension}`;
    return `${IMAGES_FOLDER}${uniqueName}`;
  }

  static async getImageUrl(imageKey?: string | null): Promise<string | null> {
    if (!imageKey) return null;
    
    try {
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: imageKey
      });

      const response = await s3Client.send(command);
      
      const region = process.env.AWS_REGION || 'us-east-1';
      return `https://${BUCKET_NAME}.s3.${region}.amazonaws.com/${imageKey}`;
      
    } catch (error) {
      console.error('Error al verificar imagen:', error);
      return null;
    }
  }

  static generateImageUrl(imageKey?: string | null): string | null {
    if (!imageKey) return null;
    const region = process.env.AWS_REGION || 'us-east-1';
    return `https://${BUCKET_NAME}.s3.${region}.amazonaws.com/${imageKey}`;
  }

  static async uploadImage(file: Express.Multer.File): Promise<UploadImageResult> {
    try {
      const validation = this.validateImage(file);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error
        };
      }

      const imageKey = this.generateImageKey(file.originalname);

      const uploadCommand = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: imageKey,
        Body: file.buffer,
        ContentType: file.mimetype,
        Metadata: {
          originalName: file.originalname,
          uploadedAt: new Date().toISOString()
        }
      });

      await s3Client.send(uploadCommand);

      const imageUrl = this.generateImageUrl(imageKey);

      return {
        success: true,
        imageUrl,
        imageKey
      };

    } catch (error) {
      console.error('Error detallado al subir imagen:', error);
      return {
        success: false,
        error: `Error interno del servidor al subir la imagen: ${error instanceof Error ? error.message : 'Error desconocido'}`
      };
    }
  }

  static async uploadMultipleImages(files: Express.Multer.File[]): Promise<UploadImageResult[]> {
    const uploadPromises = files.map(file => this.uploadImage(file));
    return Promise.all(uploadPromises);
  }

  static async deleteImage(imageKey: string): Promise<{ success: boolean; error?: string }> {
    try {
      const deleteCommand = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: imageKey
      });

      await s3Client.send(deleteCommand);

      return { success: true };

    } catch (error) {
      console.error('Error deleting image:', error);
      return {
        success: false,
        error: 'Error al eliminar la imagen'
      };
    }
  }

  static async getSignedImageUrl(imageKey: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: imageKey
      });

      const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
      return signedUrl;

    } catch (error) {
      console.error('Error generating signed URL:', error);
      throw new Error('Error generando URL firmada');
    }
  }

  static async imageExists(imageKey: string): Promise<boolean> {
    try {
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: imageKey
      });

      await s3Client.send(command);
      return true;

    } catch (error) {
      return false;
    }
  }

  static async getImageMetadata(imageKey: string): Promise<ImageMetadata | null> {
    try {
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: imageKey
      });

      const response = await s3Client.send(command);
      
      return {
        originalName: response.Metadata?.originalname || 'unknown',
        mimeType: response.ContentType || 'unknown',
        size: response.ContentLength || 0,
        uploadedAt: new Date(response.Metadata?.uploadedat || Date.now())
      };

    } catch (error) {
      console.error('Error getting image metadata:', error);
      return null;
    }
  }
}