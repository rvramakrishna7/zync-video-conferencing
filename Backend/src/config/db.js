import mongoose from "mongoose";

/**
 * Connects to MongoDB using Mongoose.
 *
 * WHY a separate file for this?
 * Separation of concerns — app.js should only care about starting the server,
 * not HOW to connect to the DB. If you switch from MongoDB to PostgreSQL
 * tomorrow, you only touch this file.
 *
 * WHY async/await here?
 * mongoose.connect() returns a Promise — it takes time to connect over the network.
 * We await it so the server doesn't start accepting requests before DB is ready.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);

    // conn.connection.host tells you WHICH MongoDB host you connected to
    // useful when you have staging vs production clusters
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB connection failed: ${error.message}`);

    // process.exit(1) — kills the Node process with error code 1
    // Code 0 = success, anything else = failure
    // We exit because there's no point running a server with no database
    process.exit(1);
  }
};

export default connectDB;
