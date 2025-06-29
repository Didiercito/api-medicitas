import { Request, Response } from 'express';
import { executeQuery } from '../config/db';
import { Doctor } from '../models/Doctor';
import { ImageService } from '../service/imageService';

export class DoctorController {
    async getAllDoctors(req: Request, res: Response): Promise<void> {
        try {
            const rows = await executeQuery('SELECT * FROM doctores');
            const doctors = rows.map((row: any) => {
                const doctor = new Doctor(
                    row.id,
                    row.nombres,
                    row.apellidos,
                    row.correo,
                    row.telefono,
                    row.especialidad_id,
                    row.duracion_consulta,
                    row.activo,
                    new Date(row.create_at),
                    new Date(row.update_at),
                    row.imagen_doctor 
                );
                
                return {
                    ...doctor,
                    imagen_doctor: ImageService.generateImageUrl(doctor.imagen_doctor)
                };
            });
            
            res.status(200).json(doctors);
        } catch (error) {
            console.error("Error al obtener doctores:", error);
            res.status(500).json({ message: "Error del servidor" });
        }
    }

    async getDoctorById(req: Request, res: Response): Promise<void> {
        const id = Number(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ message: "ID inválido" });
            return;
        }

        try {
            const result = await executeQuery('SELECT * FROM doctores WHERE id = ?', [id]);
            if (result.length === 0) {
                res.status(404).json({ message: "Doctor no encontrado" });
                return;
            }

            const row = result[0];
            const doctor = new Doctor(
                row.id,
                row.nombres,
                row.apellidos,
                row.correo,
                row.telefono,
                row.especialidad_id,
                row.duracion_consulta,
                row.activo,
                new Date(row.create_at),
                new Date(row.update_at),
                row.imagen_doctor
            );

            const doctorWithImage = {
                ...doctor,
                imagen_doctor: ImageService.generateImageUrl(doctor.imagen_doctor)
            };

            res.status(200).json(doctorWithImage);
        } catch (error) {
            console.error("Error al obtener doctor:", error);
            res.status(500).json({ message: "Error del servidor" });
        }
    }

    async createDoctor(req: Request, res: Response): Promise<void> {
        if (!req.body || Object.keys(req.body).length === 0) {
            res.status(400).json({ message: "Faltan datos en el body de la petición" });
            return;
        }

        const {
            nombres,
            apellidos,
            correo,
            telefono,
            especialidad_id,
            duracion_consulta,
            activo
        } = req.body;

        const especialidadId = typeof especialidad_id === 'string' ? parseInt(especialidad_id) : especialidad_id;
        const duracionConsulta = typeof duracion_consulta === 'string' ? parseInt(duracion_consulta) : duracion_consulta;
        const esActivo = typeof activo === 'string' ? activo === 'true' : activo;

        if (!nombres || !apellidos || !correo || !telefono || !especialidadId || !duracionConsulta || esActivo === undefined) {
            res.status(400).json({
                message: "Faltan campos obligatorios",
                received: req.body,
                required: ['nombres', 'apellidos', 'correo', 'telefono', 'especialidad_id', 'duracion_consulta', 'activo']
            });
            return;
        }

        const now = new Date();

        try {
            let imageKey: string | null = null;

            if (req.file) {
                const uploadResult = await ImageService.uploadImage(req.file);

                if (!uploadResult.success) {
                    res.status(400).json({
                        success: false,
                        message: "Error al subir la imagen",
                        error: uploadResult.error
                    });
                    return;
                }

                imageKey = uploadResult.imageKey || null;
            } else {
            }

            const result = await executeQuery(
                `INSERT INTO doctores 
            (nombres, apellidos, correo, telefono, especialidad_id, duracion_consulta, activo, imagen_doctor, create_at, update_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [nombres, apellidos, correo, telefono, especialidadId, duracionConsulta, esActivo, imageKey, now, now]
            );

            const doctor = new Doctor(
                result.insertId,
                nombres,
                apellidos,
                correo,
                telefono,
                especialidadId,
                duracionConsulta,
                esActivo,
                now,
                now,
                imageKey
            );

            const responseDoctor = {
                ...doctor,
                imagen_doctor: ImageService.generateImageUrl(imageKey)
            };
            res.status(201).json({
                success: true,
                message: "Doctor creado exitosamente",
                doctor: responseDoctor
            });

        } catch (error) {
            console.error("❌ Error al crear doctor:", error);
            res.status(500).json({
                success: false,
                message: "Error del servidor"
            });
        }
    }

    async updateDoctor(req: Request, res: Response): Promise<void> {
        const id = Number(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ message: "ID inválido" });
            return;
        }

        const {
            nombres,
            apellidos,
            correo,
            telefono,
            especialidad_id,
            duracion_consulta,
            activo
        } = req.body;

        if ((!req.body || Object.keys(req.body).length === 0) && !req.file) {
            res.status(400).json({
                success: false,
                message: "No se enviaron datos para actualizar."
            });
            return;
        }

        try {
            const existingDoctorResult = await executeQuery('SELECT * FROM doctores WHERE id = ?', [id]);
            if (existingDoctorResult.length === 0) {
                res.status(404).json({
                    success: false,
                    message: "Doctor no encontrado"
                });
                return;
            }

            const existingDoctor = existingDoctorResult[0];
            let imageKey: string | null = existingDoctor.imagen_doctor || null;

            if (req.file) {
                const uploadResult = await ImageService.uploadImage(req.file);

                if (!uploadResult.success) {
                    res.status(400).json({
                        success: false,
                        message: "Error al subir la imagen",
                        error: uploadResult.error
                    });
                    return;
                }

                if (existingDoctor.imagen_doctor) {
                    await ImageService.deleteImage(existingDoctor.imagen_doctor);
                }

                imageKey = uploadResult.imageKey || null;
            }

            const updatedData = {
                nombres: nombres || existingDoctor.nombres,
                apellidos: apellidos || existingDoctor.apellidos,
                correo: correo || existingDoctor.correo,
                telefono: telefono || existingDoctor.telefono,
                especialidad_id: especialidad_id || existingDoctor.especialidad_id,
                duracion_consulta: duracion_consulta || existingDoctor.duracion_consulta,
                activo: activo !== undefined ? activo : existingDoctor.activo,
                imagen_doctor: imageKey
            };

            const now = new Date();
            await executeQuery(
                `UPDATE doctores SET 
                    nombres = ?, apellidos = ?, correo = ?, telefono = ?, 
                    especialidad_id = ?, duracion_consulta = ?, activo = ?, 
                    imagen_doctor = ?, update_at = ?
                 WHERE id = ?`,
                [
                    updatedData.nombres,
                    updatedData.apellidos,
                    updatedData.correo,
                    updatedData.telefono,
                    updatedData.especialidad_id,
                    updatedData.duracion_consulta,
                    updatedData.activo,
                    updatedData.imagen_doctor,
                    now,
                    id
                ]
            );

            const updatedDoctorResult = await executeQuery('SELECT * FROM doctores WHERE id = ?', [id]);
            const updatedDoctor = updatedDoctorResult[0];

            const responseDoctor = {
                ...updatedDoctor,
                imagen_doctor: ImageService.generateImageUrl(updatedDoctor.imagen_doctor)
            };

            res.status(200).json({
                success: true,
                message: "Doctor actualizado correctamente",
                data: responseDoctor
            });

        } catch (error) {
            console.error("Error al actualizar doctor:", error);
            res.status(500).json({
                success: false,
                message: "Error del servidor"
            });
        }
    }

    async deleteDoctor(req: Request, res: Response): Promise<void> {
        const id = Number(req.params.id);
        const force = req.query.force === 'true';

        if (isNaN(id)) {
            res.status(400).json({ message: "ID inválido" });
            return;
        }

        try {
            const existing = await executeQuery('SELECT * FROM doctores WHERE id = ?', [id]);
            if (existing.length === 0) {
                res.status(404).json({ message: "Doctor no encontrado" });
                return;
            }

            const doctor = existing[0];

            const citasResult = await executeQuery('SELECT COUNT(*) as count FROM citas WHERE doctor_id = ?', [id]);
            const citasCount = citasResult[0].count;

            if (citasCount > 0 && !force) {
                res.status(409).json({ 
                    message: "El doctor tiene citas asociadas",
                    citasAsociadas: citasCount,
                    confirmacion: "Para eliminar el doctor y sus citas, envía la petición con ?force=true"
                });
                return;
            }

            if (citasCount > 0) {
                await executeQuery('DELETE FROM citas WHERE doctor_id = ?', [id]);
            }

            if (doctor.imagen_doctor) {
                await ImageService.deleteImage(doctor.imagen_doctor);
            }

            await executeQuery('DELETE FROM doctores WHERE id = ?', [id]);

            res.status(200).json({ 
                message: "Doctor eliminado correctamente",
                ...(citasCount > 0 && { citasEliminadas: citasCount })
            });
        } catch (error) {
            console.error("Error al eliminar doctor:", error);
            res.status(500).json({ message: "Error del servidor" });
        }
    }
}