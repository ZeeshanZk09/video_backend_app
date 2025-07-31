import mongoose from "mongoose";
import { DB_NAME, MONGODB_URI } from "../constants.js";

const connectDB = async () => {
  try {
    // if (!MONGODB_URI) {
    //   throw new Error("MONGODB_URI is not defined in environment variables");
    // }

    // Ensure the connection string ends with the database name
    const connectionString = MONGODB_URI.endsWith("/")
      ? `${MONGODB_URI}${DB_NAME}`
      : `${MONGODB_URI}/${DB_NAME}`;

    const connectionInstance = await mongoose.connect(connectionString, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // Remove these if using MongoDB 6+ or having connection issues
      // serverSelectionTimeoutMS: 5000,
      // socketTimeoutMS: 45000
    });
    console.log(
      `\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`
    );
    return connectionInstance;
  } catch (error) {
    console.log("MONGODB connection FAILED ", error);
    process.exit(1);
  }
};

export default connectDB;
