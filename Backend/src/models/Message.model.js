/**
 * Message.model.js — Chat messages sent during a meeting.
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
