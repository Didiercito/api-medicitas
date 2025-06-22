import multer from 'multer';
import { Request, Response, NextFunction } from 'express';

const uploadConfig = {
    storage: multer.memoryStorage(),
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880') 
    },
    fileFilter: (req: any, file: any, cb: any) => {
        const allowedTypes = process.env.ALLOWED_FILE_TYPES?.split(',') || [
            'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'
        ];
        
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Tipo de archivo no permitido'), false);
        }
    }
};

export const uploadSingleImage = (fieldName: string) => {
    return multer(uploadConfig).single(fieldName);
};

export const uploadUserImage = uploadSingleImage('imagen_usuario');
export const uploadDoctorImage = uploadSingleImage('imagen_doctor');

export const uploadMultipleImages = (fieldName: string, maxFiles: number = 5) => {
    return multer(uploadConfig).array(fieldName, maxFiles);
};

export const handleUploadError = (error: any, req: Request, res: Response, next: NextFunction) => {
    if (error instanceof multer.MulterError) {
        switch (error.code) {
            case 'LIMIT_FILE_SIZE':
                return res.status(400).json({
                    success: false,
                    message: `Archivo demasiado grande. Máximo ${parseInt(process.env.MAX_FILE_SIZE || '5242880') / 1024 / 1024}MB.`
                });
            case 'LIMIT_UNEXPECTED_FILE':
                return res.status(400).json({
                    success: false,
                    message: 'Campo de archivo inesperado.'
                });
            case 'LIMIT_FILE_COUNT':
                return res.status(400).json({
                    success: false,
                    message: 'Demasiados archivos.'
                });
            default:
                return res.status(400).json({
                    success: false,
                    message: `Error de archivo: ${error.message}`
                });
        }
    }
    
    if (error.message === 'Tipo de archivo no permitido') {
        return res.status(400).json({
            success: false,
            message: 'Tipo de archivo no permitido. Solo se permiten imágenes (JPEG, PNG, GIF, WebP).'
        });
    }
    
    next(error);
};

export const makeImageOptional = (fieldName: string) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const upload = uploadSingleImage(fieldName);
        upload(req, res, (error: any) => {
            if (error && error.message === 'Unexpected field') {
                next();
            } else if (error) {
                handleUploadError(error, req, res, next);
            } else {
                next();
            }
        });
    };
};