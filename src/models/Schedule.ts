export class Schedule {
    public id: number;
    public doctor_id: number;
    public dia_semana: number; 
    public hora_inicio: string;
    public hora_fin: string; 
    public activo: boolean;
    public create_at: Date;
    public update_at: Date;

    constructor(
        id: number,
        doctor_id: number,
        dia_semana: number,
        hora_inicio: string,
        hora_fin: string,
        activo: boolean,
        create_at: Date,
        update_at: Date
    ) {
        this.id = id;
        this.doctor_id = doctor_id;
        this.dia_semana = dia_semana;
        this.hora_inicio = hora_inicio;
        this.hora_fin = hora_fin;
        this.activo = activo;
        this.create_at = create_at;
        this.update_at = update_at;
    }
}