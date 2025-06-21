export class User {
    public id: number;
    public nombres: string;
    public apellidos: string;
    public correo: string;
    public contrasena: string;
    public telefono: string;
    public edad: number;
    public genero: string;
    public alergias?: string;
    public tipo_sangre?: string;
    public imagen_usuario?: string | null;
    public create_at: Date;
    public update_at: Date;

    constructor(
        id: number,
        nombres: string,
        apellidos: string,
        correo: string,
        contrasena: string,
        telefono: string,
        edad: number,
        genero: string,
        create_at: Date,
        update_at: Date,
        alergias?: string,
        tipo_sangre?: string,
        imagen_usuario?: string | null
    ) {
        this.id = id;
        this.nombres = nombres;
        this.apellidos = apellidos;
        this.edad = edad;
        this.genero = genero;
        this.correo = correo;
        this.contrasena = contrasena;
        this.telefono = telefono;
        this.alergias = alergias;
        this.tipo_sangre = tipo_sangre;
        this.imagen_usuario = imagen_usuario;
        this.create_at = create_at;
        this.update_at = update_at;
    }
}