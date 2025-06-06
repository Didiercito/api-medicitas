import { Request, Response } from 'express';
import { AppointmentService } from '../service/AppointmentService';

export class AppointmentController {
    private appointmentService: AppointmentService;

    constructor() {
        this.appointmentService = new AppointmentService();
    }

    async createAppointment(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user.userId;
            const { doctor_id, fecha_cita, hora_cita, motivo, notas } = req.body;

            if (!doctor_id || !fecha_cita || !hora_cita || !motivo) {
                res.status(400).json({
                    success: false,
                    message: 'Faltan campos requeridos: doctor_id, fecha_cita, hora_cita, motivo'
                });
                return;
            }

            const appointment = await this.appointmentService.create({
                paciente_id: userId,
                doctor_id,
                fecha_cita,
                hora_cita,
                motivo,
                notas
            });

            res.status(201).json({
                success: true,
                message: 'Cita agendada exitosamente',
                data: appointment
            });

        } catch (error: any) {
            console.error('Error creando cita:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Error interno del servidor'
            });
        }
    }

    async getPatientAppointments(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user.userId;
            const { estado, page = '1', limit = '10' } = req.query;

            const appointments = await this.appointmentService.getPatientAppointments(
                userId,
                estado as string,
                parseInt(page as string),
                parseInt(limit as string)
            );

            res.status(200).json({
                success: true,
                data: appointments,
                pagination: {
                    page: parseInt(page as string),
                    limit: parseInt(limit as string),
                    total: appointments.length
                }
            });

        } catch (error: any) {
            console.error('Error obteniendo citas:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Error interno del servidor'
            });
        }
    }

    async updateAppointment(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user.userId;
            const appointmentId = parseInt(req.params.id);
            const { fecha_cita, hora_cita, motivo, notas } = req.body;

            if (isNaN(appointmentId)) {
                res.status(400).json({
                    success: false,
                    message: 'ID de cita inválido'
                });
                return;
            }

            const updatedAppointment = await this.appointmentService.update(
                appointmentId,
                userId,
                { fecha_cita, hora_cita, motivo, notas }
            );

            res.status(200).json({
                success: true,
                message: 'Cita actualizada exitosamente',
                data: updatedAppointment
            });

        } catch (error: any) {
            console.error('Error actualizando cita:', error);

            const statusCode = error.message.includes('no encontrada') ? 404 : 400;
            res.status(statusCode).json({
                success: false,
                message: error.message || 'Error interno del servidor'
            });
        }
    }

    async cancelAppointment(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user.userId;
            const appointmentId = parseInt(req.params.id);

            if (isNaN(appointmentId)) {
                res.status(400).json({
                    success: false,
                    message: 'ID de cita inválido'
                });
                return;
            }

            await this.appointmentService.cancel(appointmentId, userId);

            res.status(200).json({
                success: true,
                message: 'Cita cancelada exitosamente'
            });

        } catch (error: any) {
            console.error('Error cancelando cita:', error);

            const statusCode = error.message.includes('no encontrada') ? 404 : 400;
            res.status(statusCode).json({
                success: false,
                message: error.message || 'Error interno del servidor'
            });
        }
    }

    async getAvailableSlots(req: Request, res: Response): Promise<void> {
        try {
            const { doctorId, fecha } = req.query;

            if (!doctorId || !fecha) {
                res.status(400).json({
                    success: false,
                    message: 'Se requieren doctorId y fecha'
                });
                return;
            }

            const slotsData = await this.appointmentService.getAvailableSlots(
                parseInt(doctorId as string),
                fecha as string
            );

            res.status(200).json({
                success: true,
                data: {
                    fecha: fecha,
                    doctor_id: doctorId,
                    ...slotsData
                }
            });

        } catch (error: any) {
            console.error('Error obteniendo slots disponibles:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Error interno del servidor'
            });
        }
    }

    async getAppointmentById(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user.userId;
            const appointmentId = parseInt(req.params.id);

            if (isNaN(appointmentId)) {
                res.status(400).json({
                    success: false,
                    message: 'ID de cita inválido'
                });
                return;
            }

            const appointment = await this.appointmentService.getById(appointmentId, userId);

            res.status(200).json({
                success: true,
                data: appointment
            });

        } catch (error: any) {
            console.error('Error obteniendo cita:', error);

            const statusCode = error.message.includes('no encontrada') ? 404 : 500;
            res.status(statusCode).json({
                success: false,
                message: error.message || 'Error interno del servidor'
            });
        }
    }

    async confirmAppointment(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user.userId;
            const appointmentId = parseInt(req.params.id);

            if (isNaN(appointmentId)) {
                res.status(400).json({
                    success: false,
                    message: 'ID de cita inválido'
                });
                return;
            }

            const confirmedAppointment = await this.appointmentService.confirm(appointmentId, userId);

            res.status(200).json({
                success: true,
                message: 'Cita confirmada exitosamente',
                data: confirmedAppointment
            });

        } catch (error: any) {
            console.error('Error confirmando cita:', error);

            const statusCode = error.message.includes('no encontrada') ? 404 : 400;
            res.status(statusCode).json({
                success: false,
                message: error.message || 'Error interno del servidor'
            });
        }
    }

    async getAppointmentWithDoctorInfo(req: Request, res: Response): Promise<void> {
    try {
        const userId = (req as any).user.userId;
        const appointmentId = parseInt(req.params.id);

        if (isNaN(appointmentId)) {
            res.status(400).json({
                success: false,
                message: 'ID de cita inválido'
            });
            return;
        }

        const appointment = await this.appointmentService.getByIdWithDoctorInfo(
            appointmentId, 
            userId
        );

        res.status(200).json({
            success: true,
            data: appointment
        });

    } catch (error: any) {
        console.error('Error obteniendo cita con información del doctor:', error);

        const statusCode = error.message.includes('no encontrada') ? 404 : 500;
        res.status(statusCode).json({
            success: false,
            message: error.message || 'Error interno del servidor'
        });
    }
}
}