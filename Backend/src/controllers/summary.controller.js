/**
 * controllers/summary.controller.js — Generates AI meeting summary via Groq.
 *
 * ─── How this works ───────────────────────────────────────────────────────────
 *
 * When the host ends the meeting:
 *  1. Frontend sends the chat transcript (array of "name: message" strings)
 *  2. We build a prompt and send it to Groq (free tier)
 *  3. Groq's Llama 3 model returns a structured bullet-point summary
 *  4. We save it to the Room document and return it
 *
 * ─── Why Groq instead of Gemini? ──────────────────────────────────────────────
 * Gemini's free tier has regional quota issues in India (limit: 0).
 * Groq is genuinely free — no credit card, no regional restrictions.
 * Free tier: 14,400 requests/day, 30 requests/minute — more than enough.
 * Speed: Groq is extremely fast — typically under 1 second response time.
 * Model: Llama 3 8B — open source, excellent at summarization tasks.
 */

import Groq from "groq-sdk";
import Room from "../models/Room.model.js";

/**
 * Initialize Groq client.
 * Reads GROQ_API_KEY from .env automatically.
 * Same pattern as Gemini — one client instance shared across all requests.
 */
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const generateSummary = async (req, res, next) => {
  try {
    const { transcript } = req.body; // array of "name: message" strings
    const { roomCode } = req.params; // from URL: /rooms/:roomCode/summary

    // Find the room to get its title for the prompt
    // and to save the summary back after generation
    const room = await Room.findOne({ roomCode });
    if (!room) {
      return res
        .status(404)
        .json({ success: false, message: "Room not found" });
    }

    // If no chat happened during the meeting, skip the API call entirely
    // and return a friendly fallback message immediately
    if (!transcript || transcript.length === 0) {
      const fallback = "No chat messages were recorded during this meeting.";
      room.summary = fallback;
      await room.save();
      return res.json({ success: true, summary: fallback });
    }

    /**
     * Array.isArray check handles both cases safely:
     * - Array: ["Alice: hello", "Bob: hi"] → joined with newlines
     * - String: already a string → used as-is
     *
     * WHY defensive check? JavaScript doesn't enforce types — if the
     * frontend ever sends a string instead of array, this won't crash.
     */
    const transcriptText = Array.isArray(transcript)
      ? transcript.join("\n")
      : transcript;

    /**
     * Groq uses the Chat Completions format (same as OpenAI).
     * Two messages:
     *   "system" → sets the AI's persona and behavior rules
     *   "user"   → the actual transcript + instructions
     *
     * WHY structure the prompt so specifically?
     * AI models give better output when you:
     *   1. Give them a role ("you are a meeting assistant")
     *   2. Provide the input data clearly labeled
     *   3. Tell them exactly what format you want the output in
     *   4. Set constraints ("concise", "skip empty sections")
     *
     * temperature: 0.3 — lower = more focused, consistent output
     * max_tokens: 1024 — enough for a detailed summary
     */
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

    /**
     * Extract the text from Groq's response.
     * choices[0].message.content contains the AI's reply.
     * The fallback string handles the rare case where content is empty.
     */
    const summary =
      completion.choices[0]?.message?.content ||
      "Summary could not be generated.";

    /**
     * Persist the summary on the Room document in MongoDB.
     *
     * WHY save it? So if someone views the room later (post-meeting),
     * the summary is already there — no need to call Groq again.
     */
    room.summary = summary;
    await room.save();

    res.json({ success: true, summary });
  } catch (error) {
    /**
     * Graceful error handling — if Groq is down or the key is invalid,
     * we don't crash the server.
     *
     * console.error logs the real error in the terminal for debugging
     * without exposing sensitive details to the client.
     */
    console.error("Summary generation failed:", error.message);
    res.status(500).json({
      success: false,
      summary: "AI summary is temporarily unavailable.",
      message: error.message,
    });
  }
};