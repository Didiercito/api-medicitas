import { Request, Response } from 'express';
import { executeQuery } from '../config/db';
import { Specialty } from '../models/Specialty';

export class SpecialtyController {
async createSpecialty(req: Request, res: Response): Promise<void> {
    const { nombre, descripcion, duracion_consulta, precio_base, activo } = req.body;

    if (!nombre || !duracion_consulta || !precio_base) {
        res.status(400).json({ message: 'Faltan campos obligatorios' });
        return;
    }

    try {
        const now = new Date();
        const isActive = activo === true ? 1 : 0; 

        await executeQuery(
            `INSERT INTO especialidades (nombre, descripcion, duracion_consulta, precio_base, activo, create_at, update_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [nombre, descripcion || null, duracion_consulta, precio_base, isActive, now, now]
        );

        res.status(201).json({ message: 'Especialidad creada exitosamente' });
    } catch (error) {
        console.error("Error al crear especialidad:", error);
        res.status(500).json({ message: 'Error del servidor' });
    }
}

async getAllSpecialties(req: Request, res: Response): Promise<void> {
    try {
        const rows = await executeQuery('SELECT * FROM especialidades WHERE activo = 1');

        const specialties = (rows as any[]).map(row =>
            new Specialty(
                row.id,
                row.nombre,
                row.descripcion,
                row.duracion_consulta,
                parseFloat(row.precio_base),
                !!row.activo,
                row.create_at,
                row.update_at
            )
        );

        res.json(specialties);
    } catch (error) {
        console.error("Error al obtener especialidades:", error);
        res.status(500).json({ message: 'Error del servidor' });
    }
}


    async getSpecialtyById(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
        try {
            const rows = await executeQuery(`SELECT * FROM especialidades WHERE id = ?`, [id]);
            if (rows.length === 0) {
                res.status(404).json({ message: 'Especialidad no encontrada' });
                return;
            }
            const row = rows[0];
            const specialty = new Specialty(
                row.id,
                row.nombre,
                row.descripcion,
                row.duracion_consulta,
                row.precio_base,
                row.activo,
                new Date(row.create_at),
                new Date(row.update_at)
            );
            res.status(200).json(specialty);
        } catch (error) {
            console.error("Error al obtener especialidad:", error);
            res.status(500).json({ message: 'Error del servidor' });
        }
    }

    async updateSpecialty(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
        const { nombre, descripcion, duracion_consulta, precio_base, activo } = req.body;

        try {
            const now = new Date();
            const result = await executeQuery(
                `UPDATE especialidades 
                 SET nombre = ?, descripcion = ?, duracion_consulta = ?, precio_base = ?, activo = ?, update_at = ?
                 WHERE id = ?`,
                [nombre, descripcion, duracion_consulta, precio_base, activo, now, id]
            );

            if ((result as any).affectedRows === 0) {
                res.status(404).json({ message: 'Especialidad no encontrada' });
                return;
            }

            res.status(200).json({ message: 'Especialidad actualizada exitosamente' });
        } catch (error) {
            console.error("Error al actualizar especialidad:", error);
            res.status(500).json({ message: 'Error del servidor' });
        }
    }

    async deleteSpecialty(req: Request, res: Response): Promise<void> {
        const { id } = req.params;

        try {
            const result = await executeQuery(
                `UPDATE especialidades SET activo = false, update_at = ? WHERE id = ?`,
                [new Date(), id]
            );

            if ((result as any).affectedRows === 0) {
                res.status(404).json({ message: 'Especialidad no encontrada' });
                return;
            }

            res.status(200).json({ message: 'Especialidad desactivada exitosamente' });
        } catch (error) {
            console.error("Error al eliminar especialidad:", error);
            res.status(500).json({ message: 'Error del servidor' });
        }
    }
}
