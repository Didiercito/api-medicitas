import { Request, Response } from "express";
import { ScheduleService } from "../service/ScheduleService";

export class ScheduleController {
    private scheduleService: ScheduleService;

    constructor() {
        this.scheduleService = new ScheduleService();
    }

    async create(req: Request, res: Response): Promise<void> {
        try {
            const { doctor_id, dia_semana, hora_inicio, hora_fin } = req.body;

            if (!doctor_id || dia_semana === undefined || !hora_inicio || !hora_fin) {
                res.status(400).json({
                    error: 'Faltan campos requeridos: doctor_id, dia_semana, hora_inicio, hora_fin'
                });
                return;
            }

            const newSchedule = await this.scheduleService.create(req.body);
            res.status(201).json(newSchedule);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al crear el horario' });
        }
    }

    async getByDoctor(req: Request, res: Response): Promise<void> {
        try {
            const doctorId = Number(req.params.doctorId);

            if (isNaN(doctorId)) {
                res.status(400).json({ error: 'ID de doctor inválido' });
                return;
            }

            const horarios = await this.scheduleService.getByDoctor(doctorId);
            res.status(200).json(horarios);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al obtener horarios del doctor' });
        }
    }

    async getById(req: Request, res: Response): Promise<void> {
        try {
            const id = Number(req.params.id);

            if (isNaN(id)) {
                res.status(400).json({ error: 'ID de horario inválido' });
                return;
            }

            const horario = await this.scheduleService.getById(id);
            if (!horario) {
                res.status(404).json({ error: 'Horario no encontrado' });
                return;
            }

            res.status(200).json(horario);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al obtener el horario' });
        }
    }

    async update(req: Request, res: Response): Promise<void> {
        try {
            const id = Number(req.params.id);

            if (isNaN(id)) {
                res.status(400).json({ error: 'ID de horario inválido' });
                return;
            }

            const updated = await this.scheduleService.update(id, req.body);

            if (!updated) {
                res.status(404).json({ error: 'Horario no encontrado' });
                return;
            }

            res.status(200).json(updated);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al actualizar el horario' });
        }
    }

    async delete(req: Request, res: Response): Promise<void> {
        try {
            const id = Number(req.params.id);

            if (isNaN(id)) {
                res.status(400).json({ error: 'ID de horario inválido' });
                return;
            }

            const deleted = await this.scheduleService.delete(id);

            if (!deleted) {
                res.status(404).json({ error: 'Horario no encontrado' });
                return;
            }

            res.status(200).json({ message: 'Horario eliminado correctamente' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al eliminar el horario' });
        }
    }
}
