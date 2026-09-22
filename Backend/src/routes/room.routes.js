import { Router } from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  createRoom,
  joinRoom,
  getRoom,
  endRoom,
} from "../controllers/room.controller.js";
import { generateSummary } from "../controllers/summary.controller.js";

const router = Router();

router.post("/", protect, createRoom); 
router.get("/:roomCode", getRoom); 
router.post("/:roomCode/join", joinRoom); 
router.patch("/:roomCode/end", protect, endRoom); 
router.post("/:roomCode/summary", protect, generateSummary);

export default router;
