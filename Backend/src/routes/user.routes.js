import { Router } from "express";
import { protect } from "../middleware/auth.middleware.js";
import { getUser, updateProfile } from "../controllers/user.controller.js";

const router = Router();

// All user routes require authentication
router.use(protect);

router.get("/:id", getUser);
router.put("/profile", updateProfile);

export default router;
