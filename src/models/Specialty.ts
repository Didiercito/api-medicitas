export class Specialty {
    public id: number;
    public nombre: string;
    public descripcion: string;
    public duracion_consulta: number; 
    public precio_base: number;
    public activo: boolean;
    public create_at: Date;
    public update_at: Date;

    constructor(
        id: number,
        nombre: string,
        descripcion: string,
        duracion_consulta: number,
        precio_base: number,
        activo: boolean,
        create_at: Date,
        update_at: Date
    ) {
        this.id = id;
        this.nombre = nombre;
        this.descripcion = descripcion;
        this.duracion_consulta = duracion_consulta;
        this.precio_base = precio_base;
        this.activo = activo;
        this.create_at = create_at;
        this.update_at = update_at;
    }
}