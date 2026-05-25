/**
 * app.js — The entry point of the entire backend.
 *
 * Think of this file as the "main()" of our server.
 * It's responsible for:
 *   1. Loading environment variables
 *   2. Creating the Express app
 *   3. Wrapping it in a Node HTTP server (needed for Socket.IO)
 *   4. Connecting to MongoDB
 *   5. Registering all middleware and routes
 *   6. Starting to listen for requests
 */

import "dotenv/config"; // Loads .env variables into process.env — must be FIRST
import express from "express";
import { createServer } from "http"; // Node's built-in HTTP module
import cors from "cors";

import connectDB from "./src/config/db.js";
import { initSocket } from "./src/socket/signaling.js";

// --- Route imports (we'll fill these in as we build each feature) ---
import authRoutes from "./src/routes/auth.routes.js";
import roomRoutes from "./src/routes/room.routes.js";
import userRoutes from "./src/routes/user.routes.js";

// ─── App Setup ────────────────────────────────────────────────────────────────

const app = express();

/**
 * WHY createServer(app)?
 *
 * Express is just a request handler (a function). By itself it can listen,
 * but Socket.IO needs access to the raw HTTP server object to intercept
 * the WebSocket "upgrade" handshake. So we wrap Express in Node's HTTP server.
 *
 * Visual:
 *   [Browser] ──HTTP──▶ [Node HTTP Server] ──▶ [Express] (REST routes)
 *                              │
 *                              └──▶ [Socket.IO] (real-time events)
 */
const httpServer = createServer(app);

// Attach Socket.IO to the same HTTP server — returns the io instance
const io = initSocket(httpServer);

// ─── Middleware ───────────────────────────────────────────────────────────────

/**
 * CORS (Cross-Origin Resource Sharing)
 *
 * By default, browsers block requests from a different "origin" (domain/port).
 * Our React app runs on localhost:5173, backend on localhost:5000 — different ports
 * = different origins = blocked without CORS headers.
 *
 * We whitelist our frontend URL from the environment variable.
 * In production this would be: https://zync.app
 */
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true, // allows cookies/auth headers to be sent cross-origin
  })
);

// Parses incoming JSON request bodies — without this, req.body is undefined
app.use(express.json());

// Parses URL-encoded form data (like traditional HTML form submissions)
app.use(express.urlencoded({ extended: true }));

// ─── Routes ───────────────────────────────────────────────────────────────────

// Health check — a simple GET "/" so you can verify the server is alive
// Used by deployment platforms (Railway, Render) and load balancers
app.get("/", (req, res) => {
  res.json({ success: true, message: "Zync API is running 🚀" });
});

// Mount route modules — all auth endpoints will be prefixed with /api/auth, etc.
app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/users", userRoutes);

// ─── 404 Handler ─────────────────────────────────────────────────────────────

/**
 * If a request reaches here, none of the routes above matched.
 * This must come AFTER all route definitions.
 */
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────

/**
 * Express recognizes a 4-argument middleware as an error handler.
 * When any route does: next(error) — it lands here.
 * This prevents unhandled errors from crashing the server.
 */
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

// ─── Start Server ─────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB(); // Wait for DB connection before accepting any traffic
  httpServer.listen(PORT, () => {
    console.log(`🚀 Zync server running on http://localhost:${PORT}`);
  });
};

start();
