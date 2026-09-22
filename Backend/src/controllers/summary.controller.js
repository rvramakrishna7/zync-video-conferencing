/**
 * controllers/summary.controller.js
 
 */

import Groq from "groq-sdk";
import Room from "../models/Room.model.js";


const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const generateSummary = async (req, res, next) => {
  try {
    const { transcript } = req.body; 
    const { roomCode } = req.params; 

  
    const room = await Room.findOne({ roomCode });
    if (!room) {
      return res
        .status(404)
        .json({ success: false, message: "Room not found" });
    }

   
    if (!transcript || transcript.length === 0) {
      const fallback = "No chat messages were recorded during this meeting.";
      room.summary = fallback;
      await room.save();
      return res.json({ success: true, summary: fallback });
    }

   
    const transcriptText = Array.isArray(transcript)
      ? transcript.join("\n")
      : transcript;

    
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile", // Llama 3.3 70B — current recommended free model on Groq
      messages: [
        {
          role: "system",
          content:
            "You are a professional meeting assistant. Create concise, structured meeting summaries with emoji bullets.",
        },
        {
          role: "user",
          content: `Analyze this chat transcript from a video meeting called "${room.title}" and create a structured summary.

Chat Transcript:
${transcriptText}

Provide a summary with these sections:
📋 **Key Discussion Points** — main topics covered
✅ **Action Items** — tasks or follow-ups mentioned
💡 **Decisions Made** — any conclusions reached
👥 **Participants** — who was actively involved

Keep it concise and professional. Skip any section that has nothing to report.`,
        },
      ],
      temperature: 0.3,
      max_tokens: 1024,
    });

   
    const summary =
      completion.choices[0]?.message?.content ||
      "Summary could not be generated.";

    
    room.summary = summary;
    await room.save();

    res.json({ success: true, summary });
  } catch (error) {

    console.error("Summary generation failed:", error.message);
    res.status(500).json({
      success: false,
      summary: "AI summary is temporarily unavailable.",
      message: error.message,
    });
  }
};