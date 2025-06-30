import { Request, Response } from 'express';
import { executeQuery } from '../config/db';
import { User } from '../models/User';
import { ImageService } from '../service/imageService';

export class UserController {
    async getAllUsers(req: Request, res: Response): Promise<void> {
        try {
            const users = await executeQuery('SELECT * FROM usuarios');
            const usersWithImages = (users as User[]).map(user => ({
                ...user,
                imagen_usuario: ImageService.generateImageUrl(user.imagen_usuario)
            }));
            res.status(200).json({
                success: true,
                message: "Usuarios obtenidos correctamente",
                data: usersWithImages // Aquí sí mantén el array porque son múltiples usuarios
            });
        } catch (error) {
            console.error('Error al obtener usuarios:', error);
            res.status(500).json({ 
                success: false,
                message: 'Error del servidor' 
            });
        }
    }

    async getUserById(req: Request, res: Response): Promise<void> {
        const { id } = req.params;

        try {
            const result = await executeQuery('SELECT * FROM usuarios WHERE id = ?', [id]);
            if (result.length === 0) {
                res.status(404).json({ 
                    success: false,
                    message: 'Usuario no encontrado' 
                });
                return;
            }

            const user = result[0] as User;
            const userWithImage = {
                ...user,
                imagen_usuario: ImageService.generateImageUrl(user.imagen_usuario)
            };
            
            // ✅ CAMBIO: Devolver objeto directamente, no array
            res.status(200).json({
                success: true,
                message: "Usuario obtenido correctamente",
                data: userWithImage  // ← Objeto directo, no [userWithImage]
            });
        } catch (error) {
            console.error('Error al obtener usuario:', error);
            res.status(500).json({ 
                success: false,
                message: 'Error del servidor' 
            });
        }
    }

    async updateUser(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
        
        const { 
            nombres, apellidos, correo, telefono, edad, genero, alergias, tipo_sangre,
            imagen_base64  // ← NUEVO CAMPO PARA BASE64
        } = req.body as Partial<User & { imagen_base64?: string }>;

        // ✅ ACTUALIZAR VALIDACIÓN PARA INCLUIR BASE64
        if ((!req.body || Object.keys(req.body).length === 0) && !req.file && !imagen_base64) {
            res.status(400).json({ 
                success: false,
                message: "No se enviaron datos para actualizar." 
            });
            return;
        }

        try {
            const existingUserResult = await executeQuery("SELECT * FROM usuarios WHERE id = ?", [id]);
            if (existingUserResult.length === 0) {
                res.status(404).json({ 
                    success: false,
                    message: "Usuario no encontrado" 
                });
                return;
            }

            const existingUser = existingUserResult[0] as User;
            let imageKey = existingUser.imagen_usuario; 

            if (imagen_base64) {
                const uploadResult = await ImageService.uploadBase64Image(imagen_base64);
                
                if (!uploadResult.success) {
                    res.status(400).json({
                        success: false,
                        message: "Error al subir la imagen desde base64",
                        error: uploadResult.error
                    });
                    return;
                }

                if (existingUser.imagen_usuario) {
                    await ImageService.deleteImage(existingUser.imagen_usuario);
                }

                imageKey = uploadResult.imageKey;
            }
            else if (req.file) {
                const uploadResult = await ImageService.uploadImage(req.file);
                
                if (!uploadResult.success) {
                    res.status(400).json({
                        success: false,
                        message: "Error al subir la imagen desde archivo",
                        error: uploadResult.error
                    });
                    return;
                }

                if (existingUser.imagen_usuario) {
                    await ImageService.deleteImage(existingUser.imagen_usuario);
                }

                imageKey = uploadResult.imageKey;
            }

            const updatedData = {
                nombres: nombres || existingUser.nombres,
                apellidos: apellidos || existingUser.apellidos,
                correo: correo || existingUser.correo,
                telefono: telefono || existingUser.telefono,
                edad: edad || existingUser.edad,
                genero: genero || existingUser.genero,
                alergias: alergias !== undefined ? alergias : existingUser.alergias,
                tipo_sangre: tipo_sangre !== undefined ? tipo_sangre : existingUser.tipo_sangre,
                imagen_usuario: imageKey  
            };

            const now = new Date();
            await executeQuery(
                `UPDATE usuarios SET 
                    nombres = ?, apellidos = ?, correo = ?, telefono = ?, 
                    edad = ?, genero = ?, alergias = ?, tipo_sangre = ?, 
                    imagen_usuario = ?, update_at = ?
                 WHERE id = ?`,
                [
                    updatedData.nombres, 
                    updatedData.apellidos, 
                    updatedData.correo, 
                    updatedData.telefono, 
                    updatedData.edad, 
                    updatedData.genero, 
                    updatedData.alergias, 
                    updatedData.tipo_sangre, 
                    updatedData.imagen_usuario, 
                    now, 
                    id
                ]
            );

            const updatedUserResult = await executeQuery("SELECT * FROM usuarios WHERE id = ?", [id]);
            const updatedUser = updatedUserResult[0] as User;

            const responseUser = {
                ...updatedUser,
                imagen_usuario: ImageService.generateImageUrl(updatedUser.imagen_usuario)
            };

            // ✅ CAMBIO: Devolver objeto directamente, no array
            res.status(200).json({
                success: true,
                message: "Usuario actualizado correctamente",
                data: responseUser  // ← Objeto directo
            });

        } catch (error) {
            console.error("Error al actualizar usuario:", error);
            res.status(500).json({ 
                success: false,
                message: "Error del servidor" 
            });
        }
    }

    async deleteUser(req: Request, res: Response): Promise<void> {
        const { id } = req.params;

        try {
            const userExists = await executeQuery("SELECT * FROM usuarios WHERE id = ?", [id]);
            if (userExists.length === 0) {
                res.status(404).json({ 
                    success: false,
                    message: "Usuario no encontrado" 
                });
                return;
            }

            const user = userExists[0] as User;

            if (user.imagen_usuario) {
                await ImageService.deleteImage(user.imagen_usuario);
            }

            await executeQuery("DELETE FROM usuarios WHERE id = ?", [id]);
            res.status(200).json({ 
                success: true,
                message: "Usuario eliminado correctamente" 
            });
        } catch (error) {
            console.error("Error al eliminar usuario:", error);
            res.status(500).json({ 
                success: false,
                message: "Error del servidor" 
            });
        }
    }
}