/**
 * auth.routes.js — Maps HTTP endpoints to controller functions.
 *
 * Routes are intentionally kept thin — no logic here, just mapping.
 * All logic lives in controllers.
 */

import { Router } from "express";
import { register, login, googleAuth, getMe } from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = Router();

// Public routes — no auth required
router.post("/register", register);
router.post("/login", login);
router.post("/google", googleAuth);

// Protected route — protect middleware runs first, then getMe
// If protect calls next(error), getMe never runs
router.get("/me", protect, getMe);

export default router;
