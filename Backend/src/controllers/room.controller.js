/**
 * room.controller.js — Create, join, fetch, and end meeting rooms.
 */

import Room from "../models/Room.model.js";
import User from "../models/User.model.js";

// CREATE ROOM 


export const createRoom = async (req, res, next) => {
  try {
    const { title } = req.body;

    const room = await Room.create({
      title: title || "Zync Meeting",
      host: req.user._id, 
      participants: [
        {
          user: req.user._id,
          name: req.user.name,
          joinedAt: new Date(),
        },
      ],
    });

   
    await User.findByIdAndUpdate(req.user._id, {
      $push: { meetingHistory: room._id },
    });

    res.status(201).json({
      success: true,
      room: {
        _id: room._id,
        roomCode: room.roomCode,
        title: room.title,
        host: req.user.name,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET ROOM INFO 

export const getRoom = async (req, res, next) => {
  try {
    const room = await Room.findOne({ roomCode: { $regex: new RegExp(`^${req.params.roomCode}$`, "i") } })
      .populate("host", "name avatar") 
      .select("-chatLog -summary"); 

    if (!room) {
      return res.status(404).json({ success: false, message: "Room not found" });
    }

    if (!room.isActive) {
      return res.status(410).json({
        success: false,
        message: "This meeting has ended",
      }); 
    }

    res.json({ success: true, room });
  } catch (error) {
    next(error);
  }
};

// JOIN ROOM 

export const joinRoom = async (req, res, next) => {
  try {
    const { name } = req.body;
    const room = await Room.findOne({ roomCode: { $regex: new RegExp(`^${req.params.roomCode}$`, "i") } })

    if (!room) {
      return res.status(404).json({ success: false, message: "Room not found" });
    }

    if (!room.isActive) {
      return res.status(410).json({ success: false, message: "This meeting has ended" });
    }

    
    const participantName = name || req.user?.name || "Guest";

    const alreadyIn = room.participants.some(
      (p) => p.user?.toString() === req.user?._id?.toString()
    );

    if (!alreadyIn) {
      room.participants.push({
        user: req.user?._id || null,
        name: participantName,
        joinedAt: new Date(),
      });
      await room.save();
    }

    res.json({
      success: true,
      room: {
        _id: room._id,
        roomCode: room.roomCode,
        title: room.title,
      },
    });
  } catch (error) {
    next(error);
  }
};

//  END ROOM 


export const endRoom = async (req, res, next) => {
  try {
    const room = await Room.findOne({ roomCode: { $regex: new RegExp(`^${req.params.roomCode}$`, "i") } })

    if (!room) {
      return res.status(404).json({ success: false, message: "Room not found" });
    }

    
    if (room.host.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only the host can end the meeting",
      }); 
    }

    room.isActive = false;
    room.endedAt = new Date();
    await room.save();

    res.json({ success: true, message: "Meeting ended", room });
  } catch (error) {
    next(error);
  }
};

// AI SUMMARY 


export const generateSummary = async (req, res, next) => {
  try {
    const { roomCode, chatLog, duration } = req.body;

   
    const transcript = chatLog?.length
      ? chatLog.map((m) => `${m.sender}: ${m.message}`).join("\n")
      : "No chat messages during this meeting.";

    const durationText = duration
      ? `${Math.floor(duration / 60)} minutes ${duration % 60} seconds`
      : "unknown duration";

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `You are a professional meeting assistant. Summarize the following meeting.

Meeting duration: ${durationText}
Room code: ${roomCode}

Chat transcript:
${transcript}

Please provide:
• A 1-2 sentence overview of what was discussed
• Key points covered (as bullet points)
• Any action items or decisions mentioned
• Overall tone/sentiment of the meeting

Keep it concise and professional. Use bullet points for clarity.`,
        },
      ],
    });

    const summary = message.content[0].text;

    
    await Room.findOneAndUpdate({ roomCode }, { summary });

    res.json({ success: true, summary });
  } catch (error) {
    console.error("Summary generation error:", error);
    next(error);
  }
};
