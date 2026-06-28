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

    // process.exit(1) — kills the Node process with error code 1
    process.exit(1);
    // We exit because there's no point running a server with no database
  }
};

export default connectDB;
