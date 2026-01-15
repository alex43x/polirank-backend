import { Router } from "express";
import authController from "../controllers/authController.js";
import authMiddleware from "../middlewares/auth.js";

const router = Router();

router.post("/login", authController.login);
router.get("/profile", authMiddleware, authController.getUserProfile);

export default router;
