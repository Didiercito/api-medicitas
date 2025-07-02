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
                data: usersWithImages
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
            
            res.status(200).json({
                success: true,
                message: "Usuario obtenido correctamente",
                data: userWithImage
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
            profileImage  
        } = req.body as Partial<User & { profileImage?: string }>;

        console.log('🔍 DEBUG: Datos recibidos en updateUser:', {
            id,
            nombres,
            apellidos,
            correo,
            telefono,
            edad,
            genero,
            alergias,
            tipo_sangre,
            profileImage: profileImage ? 
                (profileImage.startsWith('data:image') ? 'Base64 detectado' : 'URL/Key detectado') 
                : 'No hay imagen'
        });

        if ((!req.body || Object.keys(req.body).length === 0) && !req.file) {
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

            console.log('🔍 Usuario existente encontrado:', {
                id: existingUser.id,
                nombres: existingUser.nombres,
                imagen_actual: existingUser.imagen_usuario || 'Sin imagen'
            });

            if (profileImage !== undefined) {
                if (profileImage === "" || profileImage === null) {
                    console.log('🔍 Eliminando imagen existente...');
                    if (existingUser.imagen_usuario) {
                        const deleteResult = await ImageService.deleteImage(existingUser.imagen_usuario);
                        if (deleteResult.success) {
                            console.log('✅ Imagen anterior eliminada exitosamente');
                        } else {
                            console.log('⚠️ No se pudo eliminar imagen anterior:', deleteResult.error);
                        }
                    }
                    imageKey = null;
                }
                else if (profileImage && profileImage.startsWith('data:image')) {
                    console.log('🔍 Procesando imagen Base64...');
                    console.log('🔍 Tamaño de cadena Base64:', profileImage.length);
                    
                    const uploadResult = await ImageService.uploadBase64Image(profileImage);
                    
                    if (!uploadResult.success) {
                        console.error('❌ Error procesando Base64:', uploadResult.error);
                        res.status(400).json({
                            success: false,
                            message: "Error al procesar la imagen",
                            error: uploadResult.error
                        });
                        return;
                    }

                    if (existingUser.imagen_usuario) {
                        console.log('🔍 Eliminando imagen anterior...');
                        const deleteResult = await ImageService.deleteImage(existingUser.imagen_usuario);
                        if (deleteResult.success) {
                            console.log('✅ Imagen anterior eliminada exitosamente');
                        } else {
                            console.log('⚠️ No se pudo eliminar imagen anterior:', deleteResult.error);
                        }
                    }

                    imageKey = uploadResult.imageKey;
                    console.log('✅ Imagen Base64 procesada exitosamente. Nuevo key:', imageKey);
                }
                else if (profileImage && profileImage.includes('amazonaws.com')) {
                    console.log('🔍 Detectada URL de S3, extrayendo key...');
                    const extractedKey = ImageService.extractKeyFromS3Url(profileImage);
                    if (extractedKey) {
                        imageKey = extractedKey;
                        console.log('✅ Key extraído de URL:', imageKey);
                    } else {
                        console.log('⚠️ No se pudo extraer key de URL, manteniendo imagen existente');
                        imageKey = existingUser.imagen_usuario;
                    }
                }
                else if (profileImage && profileImage.includes('images/')) {
                    console.log('🔍 Detectado key directo:', profileImage);
                    imageKey = profileImage;
                }
                else if (profileImage) {
                    console.log('🔍 Formato de imagen no reconocido, manteniendo imagen existente');
                    console.log('🔍 Valor recibido:', profileImage.substring(0, 100) + '...');
                    imageKey = existingUser.imagen_usuario;
                }
            }
            else if (req.file) {
                console.log('🔍 Procesando archivo subido...');
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
                console.log('✅ Archivo subido exitosamente. Key:', imageKey);
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

            console.log('🔍 Datos a actualizar en BD:', {
                ...updatedData,
                imagen_usuario: updatedData.imagen_usuario ? 'Key presente: ' + updatedData.imagen_usuario : 'Sin imagen'
            });

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

            console.log('✅ Usuario actualizado en BD exitosamente');

            const updatedUserResult = await executeQuery("SELECT * FROM usuarios WHERE id = ?", [id]);
            const updatedUser = updatedUserResult[0] as User;

            const responseUser = {
                ...updatedUser,
                imagen_usuario: ImageService.generateImageUrl(updatedUser.imagen_usuario)
            };

            console.log('✅ Respuesta final:', {
                id: responseUser.id,
                nombres: responseUser.nombres,
                imagen_usuario: responseUser.imagen_usuario || 'Sin imagen'
            });

            res.status(200).json({
                success: true,
                message: "Usuario actualizado correctamente",
                data: responseUser
            });

        } catch (error) {
            console.error("❌ Error al actualizar usuario:", error);
            res.status(500).json({ 
                success: false,
                message: "Error del servidor",
                error: error instanceof Error ? error.message : 'Error desconocido'
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
                console.log('🔍 Eliminando imagen del usuario antes de borrar:', user.imagen_usuario);
                const deleteResult = await ImageService.deleteImage(user.imagen_usuario);
                if (deleteResult.success) {
                    console.log('✅ Imagen eliminada de S3 exitosamente');
                } else {
                    console.log('⚠️ No se pudo eliminar imagen de S3:', deleteResult.error);
                }
            }

            await executeQuery("DELETE FROM usuarios WHERE id = ?", [id]);
            
            console.log('✅ Usuario eliminado exitosamente:', id);
            
            res.status(200).json({ 
                success: true,
                message: "Usuario eliminado correctamente" 
            });
        } catch (error) {
            console.error("❌ Error al eliminar usuario:", error);
            res.status(500).json({ 
                success: false,
                message: "Error del servidor" 
            });
        }
    }
}