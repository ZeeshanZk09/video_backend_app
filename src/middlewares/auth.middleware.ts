import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt, { JwtPayload } from "jsonwebtoken";
import { IUser, User } from "../models/user.model.js";
import { ACCESS_TOKEN_SECRET } from "../constants.js";
import { Request } from "express";

export const verifyJWT = asyncHandler(
  async (req: Request<{}, {}, IUser>, _, next) => {
    try {
      const token =
        req.cookies?.accessToken ||
        req.header("Authorization")?.replace("Bearer ", "");

      // console.log(token);
      if (!token) {
        throw new ApiError(401, "Unauthorized request");
      }

      const decodedToken = jwt.verify(token, ACCESS_TOKEN_SECRET) as JwtPayload;

      const user = await User.findById(decodedToken?._id).select(
        "-password -refreshToken"
      );

      if (!user) {
        throw new ApiError(401, "Invalid Access Token");
      }

      req.user = user;
      next();
    } catch (error: any) {
      return new ApiError(401, error?.message || "Invalid access token");
    }
  }
);
