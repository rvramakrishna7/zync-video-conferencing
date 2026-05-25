/**
 * User.model.js — Defines the shape of a User document in MongoDB.
 *
 * ─── What is a Mongoose Schema? ──────────────────────────────────────────────
 *
 * MongoDB is "schemaless" — it doesn't enforce structure by default.
 * Mongoose adds a schema layer on top so you can say:
 *   "Every User document MUST have an email (string, required, unique)"
 * This gives you validation, type-safety, and structure at the app level.
 *
 * Schema → defines the shape
 * Model  → the class you use to query/create documents (User.find(), User.create())
 */

import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"], // [value, error message] — custom validation msg
      trim: true, // removes leading/trailing whitespace automatically
      maxlength: [50, "Name cannot exceed 50 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true, // creates a unique index in MongoDB — duplicate emails throw an error
      lowercase: true, // stored as lowercase so "User@Gmail.com" and "user@gmail.com" are the same
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },

    password: {
      type: String,
      minlength: [6, "Password must be at least 6 characters"],
      // Not required because Google OAuth users have no password
      select: false, // NEVER return password in queries by default — security best practice
      // To get it: User.findOne({email}).select('+password')
    },

    avatar: {
      type: String,
      default: "", // URL to profile picture (from Google OAuth or uploaded)
    },

    /**
     * authProvider tells us HOW the user signed up.
     * "local" = they filled the register form (email + password)
     * "google" = they used Google OAuth (no password)
     *
     * This matters when someone tries to login — if they registered with Google
     * but try to login with email/password, we know to redirect them.
     */
    authProvider: {
      type: String,
      enum: ["local", "google"], // only these two values are valid
      default: "local",
    },

    googleId: {
      type: String,
      default: null, // only set for Google OAuth users
    },

    // Rooms this user has participated in (array of Room IDs)
    // This lets us show "your past meetings" in their profile
    meetingHistory: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Room", // "ref" enables .populate() — joins the Room document in queries
      },
    ],
  },
  {
    /**
     * timestamps: true automatically adds:
     *   createdAt — when the document was first created
     *   updatedAt — when it was last modified
     * No need to manage these manually.
     */
    timestamps: true,
  }
);

// ─── Mongoose Middleware (Hooks) ──────────────────────────────────────────────

/**
 * Pre-save hook: runs BEFORE every .save() call.
 *
 * WHY hash here instead of in the controller?
 * Because no matter how you save a User (controller, seed script, tests),
 * the password always gets hashed. You can't accidentally save plaintext.
 *
 * WHY check isModified('password')?
 * If you update a user's name, .save() runs again — we don't want to
 * re-hash an already-hashed password. isModified returns true only when
 * the password field actually changed.
 *
 * WHY NOT use arrow function here?
 * Arrow functions don't have their own `this`. We need `this` to refer
 * to the document being saved.
 */
userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();

  // bcrypt.hash(password, saltRounds)
  // saltRounds=12 means 2^12 = 4096 hashing iterations — slow enough to
  // resist brute force, fast enough for real users (takes ~250ms)
  this.password = await bcrypt.hash(this.password, 12);
  next(); // call next() to proceed with saving
});

// ─── Instance Methods ─────────────────────────────────────────────────────────

/**
 * comparePassword — call this on a user document to verify a login attempt.
 *
 * Usage: const isMatch = await user.comparePassword(req.body.password);
 *
 * bcrypt.compare handles the timing-safe comparison internally —
 * it re-hashes the candidate with the same salt and compares.
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// mongoose.model('User', userSchema) — 'User' becomes the MongoDB collection name
// (Mongoose pluralizes it → 'users')
const User = mongoose.model("User", userSchema);

export default User;
