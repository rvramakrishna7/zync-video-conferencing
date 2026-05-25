/**
 * Room.model.js — Defines a meeting room document.
 *
 * A Room is created when someone clicks "Start Meeting".
 * It holds metadata about the call — not the video itself (WebRTC handles that).
 */

import mongoose from "mongoose";
import { customAlphabet } from "nanoid"; // compact, URL-friendly unique IDs

/**
 * nanoid generates short unique IDs like "K3fN2mP"
 * We use a custom alphabet (no ambiguous chars like 0/O, 1/l/I)
 * Length 10 = 62^10 possible IDs = practically zero collision chance
 *
 * WHY not MongoDB's ObjectId?
 * ObjectIds look like "507f1f77bcf86cd799439011" — ugly in a shareable URL.
 * "zync.app/room/K3fN2mP" is way better.
 */
const generateRoomCode = customAlphabet(
  "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789",
  10
);

const roomSchema = new mongoose.Schema(
  {
    roomCode: {
      type: String,
      unique: true,
      default: () => generateRoomCode(), // auto-generate on creation
    },

    title: {
      type: String,
      trim: true,
      default: "Zync Meeting", // default title if not specified
      maxlength: [100, "Title cannot exceed 100 characters"],
    },

    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "A room must have a host"],
    },

    /**
     * Participants array — who is/was in this room.
     * We store both the User reference and their name separately
     * because guest users (not logged in) won't have a User document.
     */
    participants: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          default: null, // null for guests
        },
        name: String, // display name (from profile or what they typed when joining)
        joinedAt: { type: Date, default: Date.now },
        leftAt: { type: Date, default: null },
      },
    ],

    /**
     * isActive controls whether new people can join.
     * When the host ends the meeting → set to false → room is "closed".
     * We keep the document (don't delete) because we need it for the AI summary.
     */
    isActive: {
      type: Boolean,
      default: true,
    },

    startedAt: {
      type: Date,
      default: Date.now,
    },

    endedAt: {
      type: Date,
      default: null,
    },

    // The AI-generated meeting summary (filled after call ends)
    summary: {
      type: String,
      default: null,
    },

    // Chat transcript stored on the room for AI summarization
    // We'll also have a separate Message model for real-time queries
    chatLog: [
      {
        sender: String,
        message: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],

    settings: {
      allowGuests: { type: Boolean, default: true }, // can non-logged-in users join?
      maxParticipants: { type: Number, default: 50 },
    },
  },
  { timestamps: true }
);

const Room = mongoose.model("Room", roomSchema);

export default Room;
