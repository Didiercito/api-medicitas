import { Request, Response } from 'express';
import { executeQuery } from '../config/db';
import { Doctor } from '../models/Doctor';

export class DoctorController {

    async getAllDoctors(req: Request, res: Response): Promise<void> {
        try {
            const rows = await executeQuery('SELECT * FROM doctores');
            const doctors = rows.map((row: any) => new Doctor(
                row.id,
                row.nombres,
                row.apellidos,
                row.correo,
                row.telefono,
                row.especialidad_id,
                row.duracion_consulta,
                row.activo,
                new Date(row.create_at),
                new Date(row.update_at)
            ));
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
                new Date(row.update_at)
            );
            res.status(200).json(doctor);
        } catch (error) {
            console.error("Error al obtener doctor:", error);
            res.status(500).json({ message: "Error del servidor" });
        }
    }

    async createDoctor(req: Request, res: Response): Promise<void> {
        const {
            nombres,
            apellidos,
            correo,
            telefono,
            especialidad_id,
            duracion_consulta,
            activo
        } = req.body;

        if (!nombres || !apellidos || !correo || !telefono || !especialidad_id || !duracion_consulta || activo === undefined) {
            res.status(400).json({ message: "Faltan campos obligatorios" });
            return;
        }

        const now = new Date();

        try {
            const result = await executeQuery(
                `INSERT INTO doctores 
                (nombres, apellidos, correo, telefono, especialidad_id, duracion_consulta, activo, create_at, update_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [nombres, apellidos, correo, telefono, especialidad_id, duracion_consulta, activo, now, now]
            );

            const doctor = new Doctor(
                result.insertId,
                nombres,
                apellidos,
                correo,
                telefono,
                especialidad_id,
                duracion_consulta,
                activo,
                now,
                now
            );

            res.status(201).json({ message: "Doctor creado exitosamente", doctor });
        } catch (error) {
            console.error("Error al crear doctor:", error);
            res.status(500).json({ message: "Error del servidor" });
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

        if (!nombres && !apellidos && !correo && !telefono && !especialidad_id && !duracion_consulta && activo === undefined) {
            res.status(400).json({ message: "No hay datos para actualizar" });
            return;
        }

        try {
            const existing = await executeQuery('SELECT * FROM doctores WHERE id = ?', [id]);
            if (existing.length === 0) {
                res.status(404).json({ message: "Doctor no encontrado" });
                return;
            }

            const fields = [];
            const values = [];

            if (nombres) { fields.push('nombres = ?'); values.push(nombres); }
            if (apellidos) { fields.push('apellidos = ?'); values.push(apellidos); }
            if (correo) { fields.push('correo = ?'); values.push(correo); }
            if (telefono) { fields.push('telefono = ?'); values.push(telefono); }
            if (especialidad_id) { fields.push('especialidad_id = ?'); values.push(especialidad_id); }
            if (duracion_consulta) { fields.push('duracion_consulta = ?'); values.push(duracion_consulta); }
            if (activo !== undefined) { fields.push('activo = ?'); values.push(activo); }

            fields.push('update_at = ?');
            const updatedAt = new Date();
            values.push(updatedAt);

            values.push(id);

            const sql = `UPDATE doctores SET ${fields.join(', ')} WHERE id = ?`;

            await executeQuery(sql, values);

            res.status(200).json({ message: "Doctor actualizado correctamente" });
        } catch (error) {
            console.error("Error al actualizar doctor:", error);
            res.status(500).json({ message: "Error del servidor" });
        }
    }

    async deleteDoctor(req: Request, res: Response): Promise<void> {
        const id = Number(req.params.id);
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

            await executeQuery('DELETE FROM doctores WHERE id = ?', [id]);

            res.status(200).json({ message: "Doctor eliminado correctamente" });
        } catch (error) {
            console.error("Error al eliminar doctor:", error);
            res.status(500).json({ message: "Error del servidor" });
        }
    }
}
