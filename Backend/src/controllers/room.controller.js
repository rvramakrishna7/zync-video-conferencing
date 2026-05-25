/**
 * room.controller.js — Create, join, fetch, and end meeting rooms.
 */

import Room from "../models/Room.model.js";
import User from "../models/User.model.js";

// ─── CREATE ROOM ──────────────────────────────────────────────────────────────

/**
 * POST /api/rooms
 * Protected — only logged-in users can create rooms.
 * The creator automatically becomes the host.
 */
export const createRoom = async (req, res, next) => {
  try {
    const { title } = req.body;

    const room = await Room.create({
      title: title || "Zync Meeting",
      host: req.user._id, // req.user set by protect middleware
      participants: [
        {
          user: req.user._id,
          name: req.user.name,
          joinedAt: new Date(),
        },
      ],
    });

    // Add this room to the host's meeting history
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

// ─── GET ROOM INFO ────────────────────────────────────────────────────────────

/**
 * GET /api/rooms/:roomCode
 * Public — anyone with the link can fetch room details to validate it exists.
 */
export const getRoom = async (req, res, next) => {
  try {
    const room = await Room.findOne({ roomCode: { $regex: new RegExp(`^${req.params.roomCode}$`, "i") } })
      .populate("host", "name avatar") // replaces host ObjectId with { name, avatar }
      .select("-chatLog -summary"); // exclude heavy fields for this lightweight check

    if (!room) {
      return res.status(404).json({ success: false, message: "Room not found" });
    }

    if (!room.isActive) {
      return res.status(410).json({
        success: false,
        message: "This meeting has ended",
      }); // 410 Gone = resource existed but is gone
    }

    res.json({ success: true, room });
  } catch (error) {
    next(error);
  }
};

// ─── JOIN ROOM ────────────────────────────────────────────────────────────────

/**
 * POST /api/rooms/:roomCode/join
 * Body: { name } — name is optional for logged-in users
 * Guests (no JWT) can join too — we only require a display name.
 */
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

    // Guest name fallback: use their provided name, or the logged-in user's name
    const participantName = name || req.user?.name || "Guest";

    // Add them to participants (only if not already in the list)
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

// ─── END ROOM ─────────────────────────────────────────────────────────────────

/**
 * PATCH /api/rooms/:roomCode/end
 * Only the host can end the room.
 * Marks it inactive — triggers AI summary generation on the frontend.
 */
export const endRoom = async (req, res, next) => {
  try {
    const room = await Room.findOne({ roomCode: { $regex: new RegExp(`^${req.params.roomCode}$`, "i") } })

    if (!room) {
      return res.status(404).json({ success: false, message: "Room not found" });
    }

    // Authorization check — only host can end the meeting
    if (room.host.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only the host can end the meeting",
      }); // 403 Forbidden — you're authenticated but not allowed
    }

    room.isActive = false;
    room.endedAt = new Date();
    await room.save();

    res.json({ success: true, message: "Meeting ended", room });
  } catch (error) {
    next(error);
  }
};

// ─── AI SUMMARY ───────────────────────────────────────────────────────────────

/**
 * POST /api/rooms/summary
 * Body: { roomCode, chatLog, duration }
 *
 * Takes the meeting's chat transcript and sends it to Claude API.
 * Claude returns a structured summary in bullet points.
 *
 * WHY use Claude here instead of GPT or another model?
 * We're already in the Anthropic ecosystem — consistent SDK, billing, and
 * Claude is particularly strong at summarization tasks.
 */
export const generateSummary = async (req, res, next) => {
  try {
    const { roomCode, chatLog, duration } = req.body;

    // Build a readable transcript from the chat log array
    const transcript = chatLog?.length
      ? chatLog.map((m) => `${m.sender}: ${m.message}`).join("\n")
      : "No chat messages during this meeting.";

    const durationText = duration
      ? `${Math.floor(duration / 60)} minutes ${duration % 60} seconds`
      : "unknown duration";

    // Dynamic import — only load the SDK when this route is actually called
    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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

    // Also save the summary to the Room document in MongoDB
    await Room.findOneAndUpdate({ roomCode }, { summary });

    res.json({ success: true, summary });
  } catch (error) {
    console.error("Summary generation error:", error);
    next(error);
  }
};
