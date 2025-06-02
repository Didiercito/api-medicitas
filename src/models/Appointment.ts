export class Appointment {
    public id: number;
    public paciente_id: number;
    public doctor_id: number;
    public fecha_cita: Date;
    public hora_cita: string; 
    public estado: string; 
    public motivo: string;
    public notas?: string;
    public precio?: number;
    public create_at: Date;
    public update_at: Date;

    constructor(
        id: number,
        paciente_id: number,
        doctor_id: number,
        fecha_cita: Date,
        hora_cita: string,
        estado: string,
        motivo: string,
        create_at: Date,
        update_at: Date,
        notas?: string,
        precio?: number
    ) {
        this.id = id;
        this.paciente_id = paciente_id;
        this.doctor_id = doctor_id;
        this.fecha_cita = fecha_cita;
        this.hora_cita = hora_cita;
        this.estado = estado;
        this.motivo = motivo;
        this.notas = notas;
        this.precio = precio;
        this.create_at = create_at;
        this.update_at = update_at;
    }
}