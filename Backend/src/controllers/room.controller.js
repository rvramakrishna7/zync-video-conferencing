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

