import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const healthCheck = asyncHandler(async (req, res) => {
  // Create health check response object
  const healthCheck = {
    status: "OK",
    uptime: `${process.uptime()} seconds`,
    timestamp: new Date().toISOString(),
    message: "Service is healthy and operational",
    details: {
      memoryUsage: process.memoryUsage(),
      platform: process.platform,
      nodeVersion: process.version,
    },
  };

  // Send success response
  return res
    .status(200)
    .json(new ApiResponse(200, healthCheck, "HealthCheck successful"));
});

export { healthCheck };
