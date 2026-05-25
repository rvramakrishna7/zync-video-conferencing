/**
 * auth.controller.js — Handles Register, Login, Google OAuth, and token refresh.
 *
 * ─── Controller Pattern ───────────────────────────────────────────────────────
 *
 * Route file  → WHAT URL triggers this (e.g. POST /api/auth/login)
 * Controller  → WHAT HAPPENS when that URL is hit (the business logic)
 * Model       → HOW data is stored/retrieved
 *
 * Keeping these three separate = easier to test and maintain.
 *
 * ─── What is a JWT? ───────────────────────────────────────────────────────────
 *
 * JSON Web Token — a self-contained token the server signs and sends to the client.
 * The client stores it and sends it back with every protected request.
 *
 * Structure: header.payload.signature
 * Example:   eyJhbGciOi.eyJ1c2VySWQiOi.SflKxwRJSMeK...
 *
 * The server doesn't store sessions — it just verifies the signature.
 * That's why JWT is "stateless" — scales without shared session storage.
 */

import jwt from "jsonwebtoken";
import User from "../models/User.model.js";

// ─── Helper: Generate JWT ─────────────────────────────────────────────────────

/**
 * Creates a signed JWT containing the user's ID.
 * We sign with our JWT_SECRET — only our server can verify it's genuine.
 *
 * payload: { id: "mongoId" } — what we embed in the token
 * expiresIn: token becomes invalid after this duration (from .env)
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

// ─── Helper: Send token response ─────────────────────────────────────────────

/**
 * Reusable function to send user data + token.
 * We exclude the password from the response (select: false handles most cases,
 * but .toObject() + delete is belt-and-suspenders).
 */
const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id);

  const userData = user.toObject();
  delete userData.password; // never send password hash to client

  res.status(statusCode).json({
    success: true,
    token,
    user: userData,
  });
};

// ─── REGISTER ─────────────────────────────────────────────────────────────────

/**
 * POST /api/auth/register
 * Body: { name, email, password }
 */
export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists BEFORE trying to create
    // (mongoose unique constraint would also catch it, but the error message is ugly)
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    // Create user — bcrypt hashing happens automatically via pre-save hook in model
    const user = await User.create({ name, email, password, authProvider: "local" });

    sendTokenResponse(user, 201, res); // 201 = Created
  } catch (error) {
    next(error); // passes to global error handler in app.js
  }
};

// ─── LOGIN ────────────────────────────────────────────────────────────────────

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    // .select('+password') overrides the schema's select:false so we get the hash
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      // Use the same message for "wrong email" and "wrong password"
      // Revealing which one is wrong is a security issue (user enumeration)
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Can't login with password if they registered via Google
    if (user.authProvider === "google") {
      return res.status(400).json({
        success: false,
        message: "This account uses Google Sign-In. Please sign in with Google.",
      });
    }

    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// ─── GOOGLE OAUTH ─────────────────────────────────────────────────────────────

/**
 * POST /api/auth/google
 * Body: { googleId, email, name, avatar }
 *
 * This is called AFTER the frontend completes Google's OAuth flow
 * and gets the user's profile info from Google.
 *
 * Flow:
 *   1. User clicks "Sign in with Google" on frontend
 *   2. Google's popup/redirect gives frontend the user's profile
 *   3. Frontend sends that profile to THIS endpoint
 *   4. We find or create the user in our DB
 *   5. Return our JWT (not Google's token)
 */
export const googleAuth = async (req, res, next) => {
  try {
    const { googleId, email, name, avatar } = req.body;

    if (!googleId || !email) {
      return res.status(400).json({
        success: false,
        message: "Google authentication data is incomplete",
      });
    }

    // Find existing user by googleId OR email (handles the case where they
    // previously registered with email/password using the same email)
    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (user) {
      // If they previously registered with email/password, link their Google account
      if (!user.googleId) {
        user.googleId = googleId;
        user.authProvider = "google";
        if (avatar && !user.avatar) user.avatar = avatar;
        await user.save();
      }
    } else {
      // Brand new user — create their account
      user = await User.create({
        name,
        email,
        avatar,
        googleId,
        authProvider: "google",
        // No password needed for Google users
      });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// ─── GET CURRENT USER ─────────────────────────────────────────────────────────

/**
 * GET /api/auth/me
 * Protected route — requires JWT in Authorization header.
 * Used by frontend on app load to restore the logged-in session.
 */
export const getMe = async (req, res, next) => {
  try {
    // req.user is set by the auth middleware (see auth.middleware.js)
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};
