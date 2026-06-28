/**
 * signaling.js — The WebRTC Signaling Server
 */

import { Server } from "socket.io";

// Tracks which users are in which room: { roomId: [{ socketId, userId, name }] }

const roomParticipants = {};

export const initSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // ── JOIN ROOM ────────────────────────────────────────────────────────────
    /**
     * Fired when a user enters a meeting room.
     *   1. Socket.IO "room" (a broadcast channel — emit to everyone in a room)
     *   2. Our in-memory roomParticipants map (to track who's here)
     */
    socket.on("join-room", ({ roomId, userId, name }) => {
      socket.join(roomId); // Socket.IO built-in room — like subscribing to a channel

      if (!roomParticipants[roomId]) roomParticipants[roomId] = [];

      roomParticipants[roomId].push({ socketId: socket.id, userId, name });

      // Tell EVERYONE ELSE in the room that a new user joined
      // socket.to(roomId) = everyone in roomId EXCEPT the sender
      socket.to(roomId).emit("user-joined", {
        socketId: socket.id,
        userId,
        name,
        participants: roomParticipants[roomId],
      });

      // Send the new user the current list of participants (so they can initiate offers to each)
      socket.emit("room-participants", roomParticipants[roomId]);

      console.log(`👤 ${name} joined room ${roomId}`);
    });

    // ── WebRTC SIGNALING EVENTS ───────────────────────────────────────────────

    /**
     * OFFER
     */
    socket.on("offer", ({ targetSocketId, offer }) => {
      // Forward the offer only to the specific target, not the whole room
      io.to(targetSocketId).emit("offer", {
        offer,
        fromSocketId: socket.id,
      });
    });

    /**
     * ANSWER 
     */
    socket.on("answer", ({ targetSocketId, answer }) => {
      io.to(targetSocketId).emit("answer", {
        answer,
        fromSocketId: socket.id,
      });
    });

    /**
     * ICE CANDIDATE 
     */
    socket.on("ice-candidate", ({ targetSocketId, candidate }) => {
      io.to(targetSocketId).emit("ice-candidate", {
        candidate,
        fromSocketId: socket.id,
      });
    });

    // ── CHAT ─────────────────────────────────────────────────────────────────

    socket.on("send-message", ({ roomId, message, sender, timestamp }) => {
      // Broadcast to everyone in the room INCLUDING the sender (io.to vs socket.to)
      io.to(roomId).emit("receive-message", { message, sender, timestamp });
    });

    // ── RAISE HAND ────────────────────────────────────────────────────────────

    socket.on("raise-hand", ({ roomId, userId, name }) => {
      socket.to(roomId).emit("hand-raised", { userId, name });
    });

    socket.on("lower-hand", ({ roomId, userId }) => {
      socket.to(roomId).emit("hand-lowered", { userId });
    });

    // ── EMOJI REACTIONS ───────────────────────────────────────────────────────

    socket.on("send-reaction", ({ roomId, emoji, name }) => {
      io.to(roomId).emit("receive-reaction", { emoji, name, socketId: socket.id });
    });

    // ── DISCONNECT ────────────────────────────────────────────────────────────

    /**
     * Fired automatically when a user closes the tab, loses internet, etc.
     */
    socket.on("disconnect", () => {
      // Find which room this socket was in and remove them
      for (const roomId in roomParticipants) {
        const before = roomParticipants[roomId].length;
        roomParticipants[roomId] = roomParticipants[roomId].filter(
          (p) => p.socketId !== socket.id
        );

        // If someone actually left this room, notify others
        if (roomParticipants[roomId].length < before) {
          socket.to(roomId).emit("user-left", { socketId: socket.id });

          // Clean up empty rooms from memory
          if (roomParticipants[roomId].length === 0) {
            delete roomParticipants[roomId];
          }
        }
      }

      console.log(`❌ Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};
