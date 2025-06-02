import { Router } from 'express';
import { SpecialtyController } from '../controllers/SpecialtyController';

const router = Router();
const specialtController = new SpecialtyController();

router.post('/create', specialtController.createSpecialty.bind(specialtController));
router.get('/get-all', specialtController.getAllSpecialties.bind(specialtController));
router.get('/:id', specialtController.getSpecialtyById.bind(specialtController));
router.put('/update/:id', specialtController.updateSpecialty.bind(specialtController));
router.delete('/delete/:id', specialtController.deleteSpecialty.bind(specialtController));

export default router;
