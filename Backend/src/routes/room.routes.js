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

router.post("/", protect, createRoom); // POST /api/rooms — create a room
router.get("/:roomCode", getRoom); // GET  /api/rooms/K3fN2mP — get room info (public)
router.post("/:roomCode/join", joinRoom); // POST /api/rooms/K3fN2mP/join — join a room
router.patch("/:roomCode/end", protect, endRoom); // PATCH /api/rooms/K3fN2mP/end — end meeting
router.post("/:roomCode/summary", protect, generateSummary);

export default router;
