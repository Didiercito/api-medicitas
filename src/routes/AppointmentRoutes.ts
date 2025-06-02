import express from 'express';
import { AppointmentController } from '../controllers/AppointmentController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();
const appointmentController = new AppointmentController();

router.post('/create', authenticateToken, appointmentController.createAppointment.bind(appointmentController));
router.get('/user-appointments', authenticateToken, appointmentController.getPatientAppointments.bind(appointmentController));
router.get('/available-slots', authenticateToken, appointmentController.getAvailableSlots.bind(appointmentController));
router.get('/:id', authenticateToken, appointmentController.getAppointmentById.bind(appointmentController));
router.put('/update/:id', authenticateToken, appointmentController.updateAppointment.bind(appointmentController));
router.delete('/cancel/:id', authenticateToken, appointmentController.cancelAppointment.bind(appointmentController));
router.put('/confirm/:id', authenticateToken, appointmentController.confirmAppointment.bind(appointmentController));

export default router;