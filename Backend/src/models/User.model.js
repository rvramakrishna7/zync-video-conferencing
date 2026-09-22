/**
 * User.model.js 
 */

import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"], 
      trim: true, 
      maxlength: [50, "Name cannot exceed 50 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true, 
      lowercase: true, 
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },

    password: {
      type: String,
      minlength: [6, "Password must be at least 6 characters"],
      select: false, 
      
    },

    avatar: {
      type: String,
      default: "", 
    },

  
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },

    googleId: {
      type: String,
      default: null, 
    },

   
    meetingHistory: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Room", 
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Mongoose Middleware (Hooks) 


userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();

  
  this.password = await bcrypt.hash(this.password, 12);
  next(); 
});

// Instance Methods 


userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};


const User = mongoose.model("User", userSchema);

export default User;
