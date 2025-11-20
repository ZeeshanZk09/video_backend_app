import { Secret, SignOptions } from "jsonwebtoken";

const DB_NAME = "video_app_backend";
const API_ROUTE = "/api/v1";
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME!;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY!;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET!;
const CORS_ORIGIN = process.env.CORS_ORIGIN!;
const PORT = process.env.PORT! || 8000;
const NODE_ENV = process.env.NODE_ENV!;
const REFRESH_TOKEN_SECRET: Secret = process.env.REFRESH_TOKEN_SECRET!;
const MONGODB_URI = process.env.MONGODB_URI! || "mongodb://localhost:27017/";
const ACCESS_TOKEN_SECRET: Secret = process.env.ACCESS_TOKEN_SECRET!;
const REFRESH_TOKEN_EXPIRY: SignOptions["expiresIn"] = "1d";
const ACCESS_TOKEN_EXPIRY: SignOptions["expiresIn"] = "10d";
export {
  REFRESH_TOKEN_EXPIRY,
  ACCESS_TOKEN_EXPIRY,
  ACCESS_TOKEN_SECRET,
  MONGODB_URI,
  REFRESH_TOKEN_SECRET,
  NODE_ENV,
  PORT,
  DB_NAME,
  API_ROUTE,
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  CORS_ORIGIN,
};
