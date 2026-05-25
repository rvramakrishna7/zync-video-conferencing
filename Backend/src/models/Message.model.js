/**
 * Message.model.js — Chat messages sent during a meeting.
 *
 * WHY a separate Message collection if Room already has chatLog?
 *
 * chatLog on Room = lightweight array used for AI summary (appended at end)
 * Message collection = real-time queryable, paginated, indexed chat history
 *
 * In a real app you'd query messages with pagination:
 *   GET /api/rooms/:roomId/messages?page=2&limit=50
 * That's hard to do efficiently on an embedded array.
 * A separate collection with an index on roomId is much faster.
 */

import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
      index: true, // creates a DB index — makes "find all messages for room X" fast
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // null for guest users
    },

    senderName: {
      type: String,
      required: true,
    },

    content: {
      type: String,
      required: [true, "Message cannot be empty"],
      maxlength: [1000, "Message too long"],
      trim: true,
    },

    type: {
      type: String,
      enum: ["text", "system"], // "system" = things like "User joined the call"
      default: "text",
    },
  },
  { timestamps: true } // createdAt acts as our message timestamp
);

const Message = mongoose.model("Message", messageSchema);

export default Message;
