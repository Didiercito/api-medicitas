import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../config/jwt';

export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
    try {
        const authHeader = req.headers['authorization'] ?? null;
        const tokenFromHeader = authHeader && authHeader.split(' ')[1];
        const tokenFromBody = req.body?.token;
        const tokenFromQuery = req.query?.token as string;

        const token = tokenFromHeader || tokenFromBody || tokenFromQuery;

        if (!token) {
            res.status(401).json({
                success: false,
                message: 'Token requerido'
            });
            return;
        }

        const decoded = verifyToken(token);
        (req as any).user = decoded;
        next();

    } catch (error) {
        res.status(403).json({
            success: false,
            message: 'Token inválido'
        });
    }
};
