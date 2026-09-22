/**
 * auth.controller.js 
 
 */

import jwt from "jsonwebtoken";
import User from "../models/User.model.js";

//  Helper: Generate JWT 

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

//  Helper: Send token response 


const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id);

  const userData = user.toObject();
  delete userData.password; 

  res.status(statusCode).json({
    success: true,
    token,
    user: userData,
  });
};

//REGISTER 

/**
 * POST /api/auth/register
 */
export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

  
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    
    const user = await User.create({ name, email, password, authProvider: "local" });

    sendTokenResponse(user, 201, res); // 201 = Created
  } catch (error) {
    next(error); 
  }
};

// LOGIN 

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    
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

// GOOGLE OAUTH

export const googleAuth = async (req, res, next) => {
  try {
    const { googleId, email, name, avatar } = req.body;

    if (!googleId || !email) {
      return res.status(400).json({
        success: false,
        message: "Google authentication data is incomplete",
      });
    }

    
    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (user) {
     
      if (!user.googleId) {
        user.googleId = googleId;
        user.authProvider = "google";
        if (avatar && !user.avatar) user.avatar = avatar;
        await user.save();
      }
    } else {
     
      user = await User.create({
        name,
        email,
        avatar,
        googleId,
        authProvider: "google",
      
      });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

//  GET CURRENT USER 


export const getMe = async (req, res, next) => {
  try {
   
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};
