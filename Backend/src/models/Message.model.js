/**
 * Message.model.js 
 */

import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
      index: true, 
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, 
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
      enum: ["text", "system"], 
      default: "text",
    },
  },
  { timestamps: true } 
);

const Message = mongoose.model("Message", messageSchema);

export default Message;
