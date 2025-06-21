import { format, parse } from 'date-fns';
import { Schedule } from '../../models/Schedule';

export class ScheduleHelper {
    
    static createFromDB(row: any): Schedule {
        return {
            id: row.id,
            doctor_id: row.doctor_id,
            dia_semana: row.dia_semana,
            hora_inicio: row.hora_inicio,
            hora_fin: row.hora_fin,
            activo: Boolean(row.activo),
            create_at: row.create_at,
            update_at: row.update_at
        };
    }

    static formatTime(timeString: string): string {
        try {
            if (typeof timeString === 'string' && /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(timeString)) {
                return timeString;
            }
            
            if (timeString as any instanceof Date) {
                return format(timeString, 'HH:mm');
            }
            
            if (typeof timeString === 'string') {
                if (timeString.includes(':') && timeString.split(':').length === 3) {
                    const [hours, minutes] = timeString.split(':');
                    return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
                }
                
                const today = new Date();
                const dateStr = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')} ${timeString}`;
                const parsedDate = new Date(dateStr);
                
                if (!isNaN(parsedDate.getTime())) {
                    return format(parsedDate, 'HH:mm');
                }
            }
            
            return timeString;
            
        } catch (error) {
            console.error('Error formateando tiempo:', error, 'Valor:', timeString);
            return timeString;
        }
    }

    static formatSchedule(schedule: Schedule): any {
        const diasSemana = [
            'Domingo', 'Lunes', 'Martes', 'Miércoles', 
            'Jueves', 'Viernes', 'Sábado'
        ];

        return {
            id: schedule.id,
            doctor_id: schedule.doctor_id,
            dia_semana: schedule.dia_semana,
            dia_nombre: diasSemana[schedule.dia_semana],
            hora_inicio: this.formatTime(schedule.hora_inicio),
            hora_fin: this.formatTime(schedule.hora_fin),
            activo: schedule.activo,
            create_at: schedule.create_at,
            update_at: schedule.update_at
        };
    }

    static generateTimeSlots(horaInicio: string, horaFin: string, intervalMinutos: number = 30): string[] {
        const slots: string[] = [];
        
        try {
            const [startHour, startMinute] = horaInicio.split(':').map(Number);
            const [endHour, endMinute] = horaFin.split(':').map(Number);
            
            const startDate = new Date();
            startDate.setHours(startHour, startMinute, 0, 0);
            
            const endDate = new Date();
            endDate.setHours(endHour, endMinute, 0, 0);
            
            const current = new Date(startDate);
            
            while (current < endDate) {
                const timeStr = `${current.getHours().toString().padStart(2, '0')}:${current.getMinutes().toString().padStart(2, '0')}`;
                slots.push(timeStr);
                current.setMinutes(current.getMinutes() + intervalMinutos);
            }
            
        } catch (error) {
            console.error('Error generando slots de tiempo:', error);
        }
        
        return slots;
    }

    static isTimeInRange(time: string, startTime: string, endTime: string): boolean {
        try {
            const [hour, minute] = time.split(':').map(Number);
            const [startHour, startMinute] = startTime.split(':').map(Number);
            const [endHour, endMinute] = endTime.split(':').map(Number);
            
            const timeMinutes = hour * 60 + minute;
            const startMinutes = startHour * 60 + startMinute;
            const endMinutes = endHour * 60 + endMinute;
            
            return timeMinutes >= startMinutes && timeMinutes <= endMinutes;
        } catch (error) {
            console.error('Error validando rango de tiempo:', error);
            return false;
        }
    }

    static getDayName(dayNumber: number): string {
        const diasSemana = [
            'Domingo', 'Lunes', 'Martes', 'Miércoles', 
            'Jueves', 'Viernes', 'Sábado'
        ];
        
        if (dayNumber >= 0 && dayNumber <= 6) {
            return diasSemana[dayNumber];
        }
        
        return 'Día inválido';
    }
}