import { ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET } from "../constants.js";
import { User } from "../models/user.model.js";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    // 1. Validate userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid user ID format");
    }

    // 2. Find user with additional checks
    const user = await User.findById(userId);
    console.log(user);
    if (!user) {
      throw new Error("User not found");
    }

    // 3. Check if token secrets exist
    if (!ACCESS_TOKEN_SECRET || !REFRESH_TOKEN_SECRET) {
      throw new Error("Token secrets not configured in environment variables");
    }

    // 4. Generate tokens with error handling
    let accessToken, refreshToken;
    try {
      accessToken = user.generateAccessToken();
      refreshToken = user.generateRefreshToken();
    } catch (tokenError) {
      console.error("Token generation error:", tokenError);
      throw new Error("Failed to sign tokens");
    }

    console.log(user);

    // 5. Save refresh token with additional validation
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return {
      accessToken,
      refreshToken,
    };
  } catch (error) {
    console.error("Error in generateAccessAndRefreshTokens:", error);
    throw new ApiError(500, error.message || "Failed to generate tokens");
  }
};

export { generateAccessAndRefreshTokens };
