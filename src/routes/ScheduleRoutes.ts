import express from 'express';
import { ScheduleController } from '../controllers/ScheduleController';

const router = express.Router();
const scheduleController = new ScheduleController();

router.post('/create', scheduleController.create.bind(scheduleController));
router.get('/doctor-schedules/:doctorId', scheduleController.getByDoctor.bind(scheduleController));
router.get('/:id', scheduleController.getById.bind(scheduleController));
router.put('/update/:id', scheduleController.update.bind(scheduleController));
router.delete('/delete/:id', scheduleController.delete.bind(scheduleController));


export default router;