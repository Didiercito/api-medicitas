export class Doctor {
    public id: number;
    public nombres: string;
    public apellidos: string;
    public correo: string;
    public telefono: string;
    public especialidad_id: number;
    public duracion_consulta: number; 
    public activo: boolean;
    public create_at: Date;
    public update_at: Date;

    constructor(
        id: number,
        nombres: string,
        apellidos: string,
        correo: string,
        telefono: string,
        especialidad_id: number,
        duracion_consulta: number,
        activo: boolean,
        create_at: Date,
        update_at: Date
    ) {
        this.id = id;
        this.nombres = nombres;
        this.apellidos = apellidos;
        this.correo = correo;
        this.telefono = telefono;
        this.especialidad_id = especialidad_id;
        this.duracion_consulta = duracion_consulta;
        this.activo = activo;
        this.create_at = create_at;
        this.update_at = update_at;
    }
}