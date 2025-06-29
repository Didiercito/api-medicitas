import { ScheduleHelper } from '../utils/helpers/ScheduleHelper';
import { Schedule } from '../models/Schedule';
import { executeQuery } from '../config/db';

interface CreateScheduleData {
    doctor_id: number;
    dia_semana: number;
    hora_inicio: string;
    hora_fin: string;
    activo?: boolean;
}

interface UpdateScheduleData {
    hora_inicio?: string;
    hora_fin?: string;
    activo?: boolean;
}

export class ScheduleService {
    
    async create(data: CreateScheduleData): Promise<any> {
        try {            
            const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
            if (!timeRegex.test(data.hora_inicio)) {
                throw new Error(`Formato de hora_inicio inválido: ${data.hora_inicio}. Use formato HH:mm`);
            }
            if (!timeRegex.test(data.hora_fin)) {
                throw new Error(`Formato de hora_fin inválido: ${data.hora_fin}. Use formato HH:mm`);
            }
            
            if (data.dia_semana < 0 || data.dia_semana > 6) {
                throw new Error(`dia_semana debe estar entre 0-6, recibido: ${data.dia_semana}`);
            }
            
            const result = await executeQuery(
                `INSERT INTO horarios (doctor_id, dia_semana, hora_inicio, hora_fin, activo, create_at, update_at)
                 VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
                [data.doctor_id, data.dia_semana, data.hora_inicio, data.hora_fin, data.activo ?? true]
            );
            
            
            const insertedId = result.insertId;
            const rows: any = await executeQuery(`SELECT * FROM horarios WHERE id = ?`, [insertedId]);
            
            
            const schedule = ScheduleHelper.createFromDB(rows[0]);
            
            const formattedSchedule = ScheduleHelper.formatSchedule(schedule);
            
            return formattedSchedule;
            
        } catch (error) {
            console.error('❌ Error en ScheduleService.create:', error);
            throw error;
        }
    }

    async getByDoctor(doctorId: number): Promise<any[]> {
        try {
            
            const rows: any = await executeQuery(
                `SELECT * FROM horarios WHERE doctor_id = ? ORDER BY dia_semana, hora_inicio`, 
                [doctorId]
            );
            
            if (rows.length === 0) {
                return [];
            }
            
            const schedules = rows.map((row: any) => {
                return ScheduleHelper.createFromDB(row);
            });
            
            return schedules.map((schedule: Schedule) => ScheduleHelper.formatSchedule(schedule));
            
        } catch (error) {
            console.error('❌ Error en ScheduleService.getByDoctor:', error);
            throw error;
        }
    }

    async update(id: number, data: UpdateScheduleData): Promise<any | null> {
        try {
            const existing = await executeQuery(`SELECT * FROM horarios WHERE id = ?`, [id]);
            if (existing.length === 0) {
                return null;
            }

            const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
            if (data.hora_inicio && !timeRegex.test(data.hora_inicio)) {
                throw new Error(`Formato de hora_inicio inválido: ${data.hora_inicio}`);
            }
            if (data.hora_fin && !timeRegex.test(data.hora_fin)) {
                throw new Error(`Formato de hora_fin inválido: ${data.hora_fin}`);
            }

            await executeQuery(
                `UPDATE horarios SET 
                    hora_inicio = COALESCE(?, hora_inicio), 
                    hora_fin = COALESCE(?, hora_fin), 
                    activo = COALESCE(?, activo), 
                    update_at = NOW() 
                 WHERE id = ?`,
                [data.hora_inicio, data.hora_fin, data.activo, id]
            );

            const rows: any = await executeQuery(`SELECT * FROM horarios WHERE id = ?`, [id]);
            
            const schedule = ScheduleHelper.createFromDB(rows[0]);
            return ScheduleHelper.formatSchedule(schedule);
            
        } catch (error) {
            console.error('❌ Error en ScheduleService.update:', error);
            throw error;
        }
    }

    async delete(id: number): Promise<boolean> {
        try {
            const result = await executeQuery(`DELETE FROM horarios WHERE id = ?`, [id]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('❌ Error en ScheduleService.delete:', error);
            throw error;
        }
    }

    async getById(id: number): Promise<any | null> {
        try {
            const rows: any = await executeQuery(`SELECT * FROM horarios WHERE id = ?`, [id]);
            
            if (rows.length === 0) {
                return null;
            }

            const schedule = ScheduleHelper.createFromDB(rows[0]);
            return ScheduleHelper.formatSchedule(schedule);
            
        } catch (error) {
            console.error('❌ Error en ScheduleService.getById:', error);
            throw error;
        }
    }
}