import jwt, { SignOptions } from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const secret = process.env.JWT_SECRET;
if (!secret) {
    throw new Error('❌ JWT_SECRET no está definido en el archivo .env');
}

export const jwtConfig = {
    secret
};

export interface JWTPayload {
    userId: number;
    correo: string;
    nombre: string;
}

export const generateToken = (payload: JWTPayload): string => {
    const options: SignOptions = {
        expiresIn: '24h'
    };

    return jwt.sign(payload, jwtConfig.secret as jwt.Secret, options);
};

export const verifyToken = (token: string): JWTPayload => {
    try {
        const decoded = jwt.verify(token, jwtConfig.secret as jwt.Secret);

        if (
            typeof decoded === 'object' &&
            decoded !== null &&
            'userId' in decoded &&
            'correo' in decoded &&
            'nombre' in decoded
        ) {
            return decoded as JWTPayload;
        }

        throw new Error('El token no contiene la información esperada');
    } catch (error) {
        throw new Error('Token inválido');
    }
};
