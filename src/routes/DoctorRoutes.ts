import express from 'express';
import { DoctorController } from '../controllers/DoctorController';
import { uploadDoctorImage, handleUploadError } from '../middleware/middlewareImgt';

const router = express.Router();
const doctorController = new DoctorController();

router.get('/get-all', doctorController.getAllDoctors.bind(doctorController));
router.get('/:id', doctorController.getDoctorById.bind(doctorController));
router.post('/create', uploadDoctorImage, doctorController.createDoctor.bind(doctorController));
router.put('/update/:id', uploadDoctorImage, doctorController.updateDoctor.bind(doctorController));
router.delete('/delete/:id', doctorController.deleteDoctor.bind(doctorController));
router.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  handleUploadError(err, req, res, next);
});

export default router;