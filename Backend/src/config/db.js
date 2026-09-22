import mongoose from "mongoose";

/**
 * Connects to MongoDB using Mongoose.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB connection failed: ${error.message}`);

    
    process.exit(1);
    
  }
};

export default connectDB;
