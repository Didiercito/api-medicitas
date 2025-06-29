import { Router } from "express";
import { UserController } from "../controllers/UserController";
import { authenticateToken } from '../middleware/authMiddleware';
import { uploadUserImage } from '../middleware/middlewareImgt';

const router = Router();
const userController = new UserController();

router.get("/get-all", userController.getAllUsers.bind(userController));
router.get("/:id", authenticateToken,userController.getUserById.bind(userController));
router.put("/update/:id", uploadUserImage,authenticateToken, userController.updateUser.bind(userController)); 
router.delete("/delete/:id", userController.deleteUser.bind(userController));

export default router;