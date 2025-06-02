import { ScheduleHelper } from './ScheduleHelper';
import { Appointment } from '../../models/Appointment';


export class AppointmentHelper {
    
    
    static formatAppointment(appointment: any): any {
        return {
            ...appointment,
            fecha_formateada: this.formatDate(appointment.fecha_cita),
            hora_formateada: ScheduleHelper.formatTime(appointment.hora_cita), 
            estado_display: this.getEstadoDisplay(appointment.estado),
            dia_nombre: ScheduleHelper.getDayName(new Date(appointment.fecha_cita).getDay()) 
        };
    }

    static formatDate(fecha: string | Date): string {
        const fechaObj = typeof fecha === 'string' ? new Date(fecha) : fecha;
        return fechaObj.toLocaleDateString('es-ES', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    }

    static getEstadoDisplay(estado: string): string {
        const estados: { [key: string]: string } = {
            'programada': 'Programada',
            'confirmada': 'Confirmada',
            'completada': 'Completada',
            'cancelada': 'Cancelada',
            'no_asistio': 'No Asistió'
        };
        return estados[estado] || estado;
    }

    static isValidTimeFormat(hora: string): boolean {
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        return timeRegex.test(hora);
    }

    static isValidDateFormat(fecha: string): boolean {
        const dateObj = new Date(fecha);
        return !isNaN(dateObj.getTime());
    }

    static getDaysUntilAppointment(fechaCita: string | Date): number {
        const fecha = typeof fechaCita === 'string' ? new Date(fechaCita) : fechaCita;
        const today = new Date();
        const diffTime = fecha.getTime() - today.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    static canModifyAppointment(fechaCita: string | Date, estado: string): boolean {
        const daysUntil = this.getDaysUntilAppointment(fechaCita);
        return estado === 'programada' && daysUntil >= 1; 
    }

    static canCancelAppointment(fechaCita: string | Date, estado: string): boolean {
        const daysUntil = this.getDaysUntilAppointment(fechaCita);
        return ['programada', 'confirmada'].includes(estado) && daysUntil >= 1;
    }

static createFromDB(row: any): Appointment {
    return new Appointment(
        row.id,
        row.paciente_id,
        row.doctor_id,
        new Date(row.fecha_cita),
        row.hora_cita,
        row.estado,
        row.motivo,
        new Date(row.create_at),
        new Date(row.update_at),
        row.notas,
        row.precio
    );
}
}