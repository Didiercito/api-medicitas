import { executeQuery } from '../config/db';
import { ScheduleService } from './ScheduleService';
import { AppointmentHelper } from '../utils/helpers/AppointmentHelper';
import { ScheduleHelper } from '../utils/helpers/ScheduleHelper';
import { Appointment } from '../models/Appointment';

interface CreateAppointmentData {
    paciente_id: number;
    doctor_id: number;
    fecha_cita: string;
    hora_cita: string;
    motivo: string;
    notas?: string;
}

interface UpdateAppointmentData {
    fecha_cita?: string;
    hora_cita?: string;
    motivo?: string;
    notas?: string;
}

export class AppointmentService {
    private scheduleService: ScheduleService;

    constructor() {
        this.scheduleService = new ScheduleService();
    }

    async create(data: CreateAppointmentData): Promise<any> {
        console.log('🔍 Datos para crear cita:', data);

        const fechaCita = new Date(data.fecha_cita + 'T00:00:00');
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        console.log('🔍 Fecha de cita:', fechaCita);
        console.log('🔍 Fecha de hoy:', hoy);
        console.log('🔍 Es fecha pasada?:', fechaCita < hoy);

        if (fechaCita < hoy) {
            throw new Error('No se pueden agendar citas en fechas pasadas');
        }

        const isValidSchedule = await this.validateDoctorSchedule(
            data.doctor_id,
            fechaCita,
            data.hora_cita
        );

        if (!isValidSchedule) {
            throw new Error('El doctor no tiene horario disponible en esa fecha y hora');
        }

        const hasConflict = await this.checkTimeConflict(
            data.doctor_id,
            data.fecha_cita,
            data.hora_cita
        );

        if (hasConflict) {
            throw new Error('El horario ya está ocupado');
        }

        const result = await executeQuery(
            `INSERT INTO citas (
                paciente_id, doctor_id, fecha_cita, hora_cita, estado, motivo, notas, create_at, update_at
            ) VALUES (?, ?, ?, ?, 'programada', ?, ?, NOW(), NOW())`,
            [data.paciente_id, data.doctor_id, data.fecha_cita, data.hora_cita, data.motivo, data.notas]
        );

        console.log('✅ Cita creada con ID:', result.insertId);
        return await this.getAppointmentWithDetails(result.insertId);
    }

    async getPatientAppointments(
        pacienteId: number,
        estado?: string,
        page: number = 1,
        limit: number = 10
    ): Promise<any[]> {
        let query = `
        SELECT c.id, c.fecha_cita, c.hora_cita, c.estado, c.motivo, c.notas,
               c.create_at, c.update_at,
               d.nombres as doctor_nombre, d.apellidos as doctor_apellido,
               e.nombre as especialidad_nombre
        FROM citas c
        JOIN doctores d ON c.doctor_id = d.id
        JOIN especialidades e ON d.especialidad_id = e.id
        WHERE c.paciente_id = ?
    `;
        const params: any[] = [Number(pacienteId)];

        if (estado && estado.trim() !== '') {
            query += ' AND c.estado = ?';
            params.push(estado.trim());
        }

        query += ' ORDER BY c.fecha_cita DESC, c.hora_cita DESC';

        const validPage = Math.max(1, parseInt(String(page)) || 1);
        const validLimit = Math.max(1, Math.min(100, parseInt(String(limit)) || 10));
        const offset = (validPage - 1) * validLimit;

        query += ` LIMIT ${validLimit} OFFSET ${offset}`;

        try {
            const appointments = await executeQuery(query, params);
            return appointments.map((row: any) => {
                const appointment = AppointmentHelper.createFromDB(row);
                return AppointmentHelper.formatAppointment(appointment);
            });
        } catch (error) {
            console.error('❌ Error en getPatientAppointments:', error);
            throw error;
        }
    }

    async update(id: number, pacienteId: number, data: UpdateAppointmentData): Promise<any> {
        const existing = await executeQuery(
            'SELECT * FROM citas WHERE id = ? AND paciente_id = ?',
            [id, pacienteId]
        );

        if (existing.length === 0) {
            throw new Error('Cita no encontrada');
        }

        if (existing[0].estado !== 'programada') {
            throw new Error('Solo se pueden modificar citas programadas');
        }

        if (data.fecha_cita || data.hora_cita) {
            // ✅ Corregir el manejo de fechas
            let fechaString: string;

            if (data.fecha_cita) {
                // Si viene nueva fecha, usarla directamente
                fechaString = data.fecha_cita;
            } else {
                // Si no hay nueva fecha, convertir la existente a string
                const existingDate = existing[0].fecha_cita;
                if (existingDate instanceof Date) {
                    fechaString = existingDate.toISOString().split('T')[0];
                } else {
                    fechaString = existingDate;
                }
            }

            const fechaCita = new Date(fechaString + 'T00:00:00');
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);

            console.log('🔍 Fecha procesada:', fechaString);
            console.log('🔍 Fecha objeto:', fechaCita);
            console.log('🔍 Es válida:', !isNaN(fechaCita.getTime()));

            if (isNaN(fechaCita.getTime())) {
                throw new Error('Fecha inválida');
            }

            if (fechaCita < hoy) {
                throw new Error('No se pueden agendar citas en fechas pasadas');
            }

            const horaCita = data.hora_cita || existing[0].hora_cita;

            const isValidSchedule = await this.validateDoctorSchedule(
                existing[0].doctor_id,
                fechaCita,
                horaCita
            );

            if (!isValidSchedule) {
                throw new Error('El doctor no tiene horario disponible en esa fecha y hora');
            }

            const hasConflict = await this.checkTimeConflict(
                existing[0].doctor_id,
                fechaString, // Usar string para la consulta SQL
                horaCita,
                id
            );

            if (hasConflict) {
                throw new Error('El horario ya está ocupado');
            }
        }

        // ✅ Manejar la fecha para el UPDATE también
        let fechaParaUpdate: string;

        if (data.fecha_cita) {
            fechaParaUpdate = data.fecha_cita;
        } else {
            const existingDate = existing[0].fecha_cita;
            if (existingDate instanceof Date) {
                fechaParaUpdate = existingDate.toISOString().split('T')[0];
            } else {
                fechaParaUpdate = existingDate;
            }
        }

        const updateParams = [
            fechaParaUpdate,
            data.hora_cita || existing[0].hora_cita,
            data.motivo || existing[0].motivo,
            data.notas !== undefined ? data.notas : existing[0].notas,
            id
        ];

        await executeQuery(
            `UPDATE citas SET 
        fecha_cita = ?,
        hora_cita = ?,
        motivo = ?,
        notas = ?,
        update_at = NOW()
     WHERE id = ?`,
            updateParams
        );

        return await this.getAppointmentWithDetails(id);
    }

    async cancel(id: number, pacienteId: number): Promise<void> {
        const existing = await executeQuery(
            'SELECT estado FROM citas WHERE id = ? AND paciente_id = ?',
            [id, pacienteId]
        );

        if (existing.length === 0) {
            throw new Error('Cita no encontrada');
        }

        if (!['programada', 'confirmada'].includes(existing[0].estado)) {
            throw new Error('No se puede cancelar esta cita');
        }

        await executeQuery(
            'UPDATE citas SET estado = "cancelada", update_at = NOW() WHERE id = ?',
            [id]
        );
    }

    async confirm(id: number, pacienteId: number): Promise<any> {
    const existing = await executeQuery(
        'SELECT * FROM citas WHERE id = ? AND paciente_id = ?',
        [id, pacienteId]
    );

    if (existing.length === 0) {
        throw new Error('Cita no encontrada');
    }

    if (existing[0].estado !== 'programada') {
        throw new Error('Solo se pueden confirmar citas programadas');
    }

    await executeQuery(
        'UPDATE citas SET estado = "confirmada", update_at = NOW() WHERE id = ?',
        [id]
    );

    return await this.getAppointmentWithDetails(id);
    }

    async getAvailableSlots(doctorId: number, fecha: string): Promise<any> {
        console.log('🔍 Obteniendo slots para doctor:', doctorId, 'fecha:', fecha);

        const fechaObj = new Date(fecha + 'T00:00:00');
        const diaSemana = fechaObj.getDay();

        console.log('🔍 Día de la semana:', diaSemana);

        const horarios = await this.scheduleService.getByDoctor(doctorId);
        console.log('🔍 Horarios del doctor:', horarios);

        const horarioDelDia = horarios.find(h => h.dia_semana === diaSemana && h.activo);
        console.log('🔍 Horario del día encontrado:', horarioDelDia);

        if (!horarioDelDia) {
            console.log('❌ No hay horarios para el día:', diaSemana);
            return {
                slots: [],
                resumen: {
                    total: 0,
                    disponibles: 0,
                    ocupados: 0
                }
            };
        }

        // Generar todos los slots posibles
        const allSlots = ScheduleHelper.generateTimeSlots(
            horarioDelDia.hora_inicio,
            horarioDelDia.hora_fin,
            40 // duración en minutos
        );

        console.log('🔍 Slots generados:', allSlots);

        // Obtener citas existentes para esta fecha y doctor
        const citasExistentes = await executeQuery(
            `SELECT hora_cita, motivo, id 
         FROM citas 
         WHERE doctor_id = ? AND fecha_cita = ? 
         AND estado IN ('programada', 'confirmada')`,
            [doctorId, fecha]
        );

        console.log('🔍 Citas existentes:', citasExistentes);

        // Crear mapa de horas ocupadas con información adicional
        const horasOcupadas = new Map();
        citasExistentes.forEach((cita: any) => {
            horasOcupadas.set(cita.hora_cita, {
                motivo: cita.motivo,
                citaId: cita.id
            });
        });

        // Mapear todos los slots con su estado
        const slotsConEstado = allSlots.map((slot: string) => {
            const isOcupado = horasOcupadas.has(slot);
            const citaInfo = horasOcupadas.get(slot);

            return {
                hora: slot,
                estado: isOcupado ? 'ocupado' : 'disponible',
                disponible: !isOcupado,
                ...(isOcupado && {
                    motivo: citaInfo.motivo,
                    cita_id: citaInfo.citaId
                })
            };
        });

        // Calcular resumen
        const disponibles = slotsConEstado.filter(slot => slot.disponible).length;
        const ocupados = slotsConEstado.filter(slot => !slot.disponible).length;

        console.log('🔍 Slots con estado:', slotsConEstado);

        return {
            slots: slotsConEstado,
            resumen: {
                total: allSlots.length,
                disponibles: disponibles,
                ocupados: ocupados
            }
        };
    }

    private async validateDoctorSchedule(
        doctorId: number,
        fecha: Date,
        hora: string
    ): Promise<boolean> {
        console.log('🔍 Validando horario del doctor:', { doctorId, fecha, hora });

        const diaSemana = fecha.getDay();
        const horarios = await this.scheduleService.getByDoctor(doctorId);

        console.log('🔍 Día de la semana:', diaSemana);
        console.log('🔍 Horarios disponibles:', horarios);

        const horarioDelDia = horarios.find(h =>
            h.dia_semana === diaSemana &&
            h.activo &&
            hora >= h.hora_inicio &&
            hora <= h.hora_fin
        );

        console.log('🔍 Horario válido encontrado:', !!horarioDelDia);
        return !!horarioDelDia;
    }

    private async checkTimeConflict(
        doctorId: number,
        fecha: string,
        hora: string,
        excludeAppointmentId?: number
    ): Promise<boolean> {
        let query = `
            SELECT id FROM citas 
            WHERE doctor_id = ? AND fecha_cita = ? AND hora_cita = ? 
            AND estado IN ('programada', 'confirmada')
        `;
        const params = [doctorId, fecha, hora];

        if (excludeAppointmentId) {
            query += ' AND id != ?';
            params.push(excludeAppointmentId);
        }

        const conflicts = await executeQuery(query, params);
        console.log('🔍 Conflictos encontrados:', conflicts.length);
        return conflicts.length > 0;
    }

    async getById(id: number, pacienteId: number): Promise<any> {
        const result = await executeQuery(
            `SELECT c.*, 
                d.nombres as doctor_nombre, d.apellidos as doctor_apellido,
                e.nombre as especialidad_nombre
         FROM citas c
         JOIN doctores d ON c.doctor_id = d.id
         JOIN especialidades e ON d.especialidad_id = e.id
         WHERE c.id = ? AND c.paciente_id = ?`,
            [id, pacienteId]
        );

        if (result.length === 0) {
            throw new Error('Cita no encontrada');
        }

        const appointment = AppointmentHelper.createFromDB(result[0]);
        return AppointmentHelper.formatAppointment(appointment);
    }

    private async getAppointmentWithDetails(appointmentId: number): Promise<Appointment> {
        const result = await executeQuery(
            `SELECT c.*, 
                d.nombres as doctor_nombre, d.apellidos as doctor_apellido,
                e.nombre as especialidad_nombre
         FROM citas c
         JOIN doctores d ON c.doctor_id = d.id
         JOIN especialidades e ON d.especialidad_id = e.id
         WHERE c.id = ?`,
            [appointmentId]
        );

        const appointment = AppointmentHelper.createFromDB(result[0]);
        return AppointmentHelper.formatAppointment(appointment);
    }
}