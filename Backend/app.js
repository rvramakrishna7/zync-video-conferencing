/**
 * app.js — The entry point of the entire backend.
 *   1. Loading environment variables
 *   2. Creating the Express app
 *   3. Wrapping it in a Node HTTP server (needed for Socket.IO)
 *   4. Connecting to MongoDB
 *   5. Registering all middleware and routes
 *   6. Starting to listen for requests
 */

import "dotenv/config";               // Loads .env variables into process.env 
import express from "express";
import { createServer } from "http";  // Node's built-in HTTP module
import cors from "cors";

import connectDB from "./src/config/db.js";
import { initSocket } from "./src/socket/signaling.js";

// --- Route imports 
import authRoutes from "./src/routes/auth.routes.js";
import roomRoutes from "./src/routes/room.routes.js";
import userRoutes from "./src/routes/user.routes.js";

// ─── App Setup ────────────────────────────────────────────────────────────────

const app = express();

const httpServer = createServer(app);

// Attach Socket.IO to the same HTTP server — returns the io instance
const io = initSocket(httpServer);

// ─── Middleware ───────────────────────────────────────────────────────────────

/**
 * CORS (Cross-Origin Resource Sharing)
 */
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Postman)
      if (!origin) return callback(null, true);

      const allowedOrigins = [
        process.env.CLIENT_URL,
        "http://localhost:5173",
        "https://zync-video-conferencing.vercel.app",
      ].filter(Boolean);

     
      const isVercelPreview = origin.includes("rvramakrishna7s-projects.vercel.app");

      if (allowedOrigins.includes(origin) || isVercelPreview) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked: ${origin}`));
      }
    },
    credentials: true,
  })
);

// Parses incoming JSON request bodies — without this, req.body is undefined
app.use(express.json());

// Parses URL-encoded form data (like traditional HTML form submissions)
app.use(express.urlencoded({ extended: true }));

// ─── Routes ───────────────────────────────────────────────────────────────────

// Health check 
app.get("/", (req, res) => {
  res.json({ success: true, message: "Zync API is running 🚀" });
});

// Mount route modules 
app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/users", userRoutes);

// ─── 404 Handler ─────────────────────────────────────────────────────────────

/**
 * If a request reaches here, none of the routes above matched.
 */
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────

/**
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
  httpServer.listen(PORT,"0.0.0.0", () => {
    console.log(`🚀 Zync server running on http://localhost:${PORT}`);
  });
};

start();
