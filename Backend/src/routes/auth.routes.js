/**
 * auth.routes.js 
 */

import { Router } from "express";
import { register, login, googleAuth, getMe } from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = Router();

// Public routes — no auth required
router.post("/register", register);
router.post("/login", login);
router.post("/google", googleAuth);


router.get("/me", protect, getMe);

export default router;
