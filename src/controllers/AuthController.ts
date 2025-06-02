import { Request, Response } from 'express';
import { executeQuery } from '../config/db';
import { generateToken } from '../config/jwt';
import bcrypt from 'bcrypt';
import { User } from '../models/User'; 

export class AuthController {
    async register(req: Request, res: Response): Promise<void> {
        if (!req.body) {
            res.status(400).json({ message: "Faltan campos" });
            return;
        }

        const {
            nombres, apellidos, correo, contrasena, telefono,
            edad, genero, alergias, tipo_sangre
        } = req.body as Partial<User> & { contrasena: string };

        if (!nombres || !apellidos || !correo || !contrasena || !telefono || !edad || !genero) {
            res.status(400).json({ message: "Faltan campos obligatorios" });
            return;
        }

        try {
            const existingUser: User[] = await executeQuery("SELECT * FROM usuarios WHERE correo = ?", [correo]);
            if (existingUser.length > 0) {
                res.status(400).json({ message: "El correo ya está registrado." });
                return;
            }

            const hashedPassword = await bcrypt.hash(contrasena, 10);
            const now = new Date();
            await executeQuery(
                `INSERT INTO usuarios 
                (nombres, apellidos, correo, contrasena, telefono, edad, genero, alergias, tipo_sangre, create_at, update_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [nombres, apellidos, correo, hashedPassword, telefono, edad, genero, alergias || null, tipo_sangre || null, now, now]
            );

            res.status(201).json({ message: "Usuario registrado exitosamente" });
        } catch (error) {
            console.error("Error en register:", error);
            res.status(500).json({ message: "Error del servidor" });
        }
    }

    async login(req: Request, res: Response): Promise<void> {
        const { correo, contrasena } = req.body;

        if (!correo || !contrasena) {
            res.status(400).json({ message: "Faltan campos obligatorios: correo y contraseña" });
            return;
        }

        try {
            const rows: User[] = await executeQuery("SELECT * FROM usuarios WHERE correo = ?", [correo]);
            const user = rows[0];
            if (!user) {
                res.status(401).json({ message: "Correo o contraseña inválidos" });
                return;
            }

            const isMatch = await bcrypt.compare(contrasena, user.contrasena);
            if (!isMatch) {
                res.status(401).json({ message: "Correo o contraseña inválidos" });
                return;
            }

            const token = generateToken({
                userId: user.id,
                correo: user.correo,
                nombre: user.nombres
            });

            res.status(200).json({
                message: "Inicio de sesión exitoso",
                token
            });
        } catch (error) {
            console.error("Error en login:", error);
            res.status(500).json({ message: "Error del servidor" });
        }
    }
}
