import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

export const dbConfig = {
    host: process.env.DB_HOST_MYSQL,
    port: parseInt(process.env.DB_PORT_MYSQL || '3306'),
    user: process.env.DB_USER_MYSQL,
    password: process.env.DB_PASSWORD_MYSQL,
    database: process.env.DB_NAME_MYSQL,
    waitForConnections: true,
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT_MYSQL || '10'),
    queueLimit: 0,
};

export const pool = mysql.createPool(dbConfig);

export const testConnection = async (): Promise<void> => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Conexión a MySQL establecida correctamente');
        connection.release();
    } catch (error) {
        console.error('❌ Error al conectar con MySQL:', error);
        throw error;
    }
};

export const closeConnection = async (): Promise<void> => {
    try {
        await pool.end();
        console.log('🔌 Conexión a MySQL cerrada correctamente');
    } catch (error) {
        console.error('❌ Error al cerrar la conexión:', error);
        throw error;
    }
};

export const executeQuery = async (query: string, params?: any[]): Promise<any> => {
    try {
        const cleanParams = params ? params.map(param => {
            if (param === undefined) {
                console.warn('⚠️ Parámetro undefined encontrado, convirtiendo a null');
                return null;
            }
            
            if (typeof param === 'string' && !isNaN(Number(param)) && param.trim() !== '') {
                const numValue = Number(param);
                return numValue;
            }
            
            return param;
        }) : undefined;
        const [rows] = await pool.execute(query, cleanParams);
        return rows;
    } catch (error) {
        throw error;
    }
};

export const executeTransaction = async (queries: Array<{query: string, params?: any[]}>): Promise<any> => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        const results = [];
        for (const {query, params} of queries) {
            console.log('🔍 Ejecutando query en transacción:', query);
            console.log('🔍 Con parámetros:', params);
            
            const [result] = await connection.execute(query, params);
            results.push(result);
        }
        
        await connection.commit();
        console.log('✅ Transacción completada exitosamente');
        return results;
    } catch (error) {
        await connection.rollback();
        console.error('❌ Error en transacción, haciendo rollback:', error);
        throw error;
    } finally {
        connection.release();
    }
};