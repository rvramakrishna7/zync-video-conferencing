/**
 * auth.middleware.js — Protects routes that require a logged-in user.
 *
 * ─── What is Middleware? ──────────────────────────────────────────────────────
 *
 * Middleware is a function that runs BETWEEN the request arriving and your
 * route handler running. It has access to (req, res, next).
 *
 * Calling next() = "I'm done, pass control to the next function"
 * Calling res.json() without next() = "I'm ending the request here"
 *
 * Chain visualization:
 *   Request → [CORS middleware] → [JSON parser] → [Auth middleware] → [Route handler]
 *
 * If auth middleware calls res.status(401).json(...), the route handler
 * never runs. That's how we "protect" routes.
 *
 * ─── How Auth Works End-to-End ────────────────────────────────────────────────
 *
 *   1. User logs in → server returns JWT
 *   2. Frontend stores JWT (localStorage or memory)
 *   3. Frontend sends JWT in every request header:
 *        Authorization: Bearer eyJhbGciOi...
 *   4. This middleware extracts it, verifies the signature, decodes the userId
 *   5. Attaches user to req.user so the route handler can use it
 */

import jwt from "jsonwebtoken";
import User from "../models/User.model.js";

export const protect = async (req, res, next) => {
  try {
    let token;

    // Extract token from the Authorization header
    // Format: "Bearer <token>" — we split on space and take the second part
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Please log in.",
      });
    }

    /**
     * jwt.verify(token, secret) does two things:
     *   1. Verifies the signature (was this token really signed by us?)
     *   2. Checks expiry (is it still valid?)
     * If either fails, it throws an error — caught below.
     *
     * Returns the decoded payload: { id: "mongoId", iat: 1234, exp: 5678 }
     */
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch fresh user data from DB (in case user was deleted or role changed)
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "The user belonging to this token no longer exists.",
      });
    }

    // Attach user to the request object — available in all downstream handlers
    req.user = user;
    next();
  } catch (error) {
    // jwt.verify throws specific errors we can handle gracefully
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Your session has expired. Please log in again.",
      });
    }
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token. Please log in again.",
      });
    }
    next(error);
  }
};
