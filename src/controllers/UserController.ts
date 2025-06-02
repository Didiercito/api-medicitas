import { Request, Response } from 'express';
import { executeQuery } from '../config/db';
import { User } from '../models/User';

export class UserController {
    async getAllUsers(req: Request, res: Response): Promise<void> {
        try {
            const users = await executeQuery('SELECT * FROM usuarios');
            res.status(200).json(users as User[]);
        } catch (error) {
            console.error('Error al obtener usuarios:', error);
            res.status(500).json({ message: 'Error del servidor' });
        }
    }

    async getUserById(req: Request, res: Response): Promise<void> {
        const { id } = req.params;

        try {
            const result = await executeQuery('SELECT * FROM usuarios WHERE id = ?', [id]);
            if (result.length === 0) {
                res.status(404).json({ message: 'Usuario no encontrado' });
                return;
            }

            const user = result[0] as User;
            res.status(200).json(user);
        } catch (error) {
            console.error('Error al obtener usuario:', error);
            res.status(500).json({ message: 'Error del servidor' });
        }
    }

    async updateUser(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
        const { nombres, apellidos, correo, telefono, edad, genero, alergias, tipo_sangre } = req.body as Partial<User>;

        if (!req.body || Object.keys(req.body).length === 0) {
            res.status(400).json({ message: "No se enviaron datos para actualizar." });
            return;
        }

        try {
            const existingUser = await executeQuery("SELECT * FROM usuarios WHERE id = ?", [id]);
            if (existingUser.length === 0) {
                res.status(404).json({ message: "Usuario no encontrado" });
                return;
            }

            const now = new Date();
            await executeQuery(
                `UPDATE usuarios SET 
                    nombres = ?, apellidos = ?, correo = ?, telefono = ?, 
                    edad = ?, genero = ?, alergias = ?, tipo_sangre = ?, update_at = ?
                 WHERE id = ?`,
                [nombres, apellidos, correo, telefono, edad, genero, alergias, tipo_sangre, now, id]
            );

            res.status(200).json({ message: "Usuario actualizado correctamente" });
        } catch (error) {
            console.error("Error al actualizar usuario:", error);
            res.status(500).json({ message: "Error del servidor" });
        }
    }

    async deleteUser(req: Request, res: Response): Promise<void> {
        const { id } = req.params;

        try {
            const userExists = await executeQuery("SELECT * FROM usuarios WHERE id = ?", [id]);
            if (userExists.length === 0) {
                res.status(404).json({ message: "Usuario no encontrado" });
                return;
            }

            await executeQuery("DELETE FROM usuarios WHERE id = ?", [id]);
            res.status(200).json({ message: "Usuario eliminado correctamente" });
        } catch (error) {
            console.error("Error al eliminar usuario:", error);
            res.status(500).json({ message: "Error del servidor" });
        }
    }
}
