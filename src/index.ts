import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors'; 
import { testConnection } from './config/db';
import routerAuth from './routes/AuthRoutes';
import routerUser from './routes/UserRoutes';
import routerDoctor from './routes/DoctorRoutes';
import routerSpecialty from './routes/SpecialtyRoutes';
import routerAppointment from './routes/AppointmentRoutes';
import routerSchedule from './routes/ScheduleRoutes';

dotenv.config();


const PORT = process.env.PORT;
const app = express();
app.use(express.json());
app.use(cors({origin: '*'}));


app.use('/api/v1/user', routerUser);
app.use('/api/v1/auth', routerAuth);
app.use('/api/v1/doctor', routerDoctor);
app.use('/api/v1/specialty', routerSpecialty);
app.use('/api/v1/appointment', routerAppointment)
app.use('/api/v1/schedule', routerSchedule)

const startServer = async () => {
    try {
        await testConnection();
        app.listen(PORT, () => {
            console.log(`Servidor corriendo en: http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('❌ No se pudo iniciar el servidor por un error en la conexión a la base de datos.');
    }
};

startServer();
