import express from 'express';
import { DoctorController } from '../controllers/DoctorController';

const router = express.Router();
const doctorController = new DoctorController();

router.get('/get-all', doctorController.getAllDoctors.bind(doctorController));
router.get('/:id', doctorController.getDoctorById.bind(doctorController));
router.post('/create', doctorController.createDoctor.bind(doctorController));
router.put('/update/:id', doctorController.updateDoctor.bind(doctorController));
router.delete('/delete/:id', doctorController.deleteDoctor.bind(doctorController));

export default router;
