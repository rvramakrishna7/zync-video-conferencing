/**
 * Room.model.js
 */

import mongoose from "mongoose";
import { customAlphabet } from "nanoid"; 


const generateRoomCode = customAlphabet(
  "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789",
  10
);

const roomSchema = new mongoose.Schema(
  {
    roomCode: {
      type: String,
      unique: true,
      default: () => generateRoomCode(), 
    },

    title: {
      type: String,
      trim: true,
      default: "Zync Meeting", 
      maxlength: [100, "Title cannot exceed 100 characters"],
    },

    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "A room must have a host"],
    },

    
    participants: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          default: null, // null for guests
        },
        name: String, 
        joinedAt: { type: Date, default: Date.now },
        leftAt: { type: Date, default: null },
      },
    ],

    
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

    
    summary: {
      type: String,
      default: null,
    },

  
    chatLog: [
      {
        sender: String,
        message: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],

    settings: {
      allowGuests: { type: Boolean, default: true }, 
      maxParticipants: { type: Number, default: 50 },
    },
  },
  { timestamps: true }
);

const Room = mongoose.model("Room", roomSchema);

export default Room;
