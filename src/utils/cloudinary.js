import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import {
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  CLOUDINARY_CLOUD_NAME,
} from "../constants.js";

// Configure Cloudinary
cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
  secure: true, // Always use HTTPS
});

/**
 * Uploads a file to Cloudinary
 * @param {string} localFilePath - Path to the local file
 * @returns {Promise<Object|null>} - Cloudinary response object or null if failed
 */
const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath || !fs.existsSync(localFilePath)) {
      console.warn("File not found at path:", localFilePath);
      return null;
    }

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
      timeout: 60000,
    });

    // Clean up local file
    try {
      fs.unlinkSync(localFilePath);
    } catch (unlinkError) {
      console.error("Error deleting local file:", unlinkError.message);
    }

    return response;
  } catch (error) {
    console.error("Cloudinary upload error:", error.message);

    // Attempt to clean up local file if it exists
    if (localFilePath && fs.existsSync(localFilePath)) {
      try {
        fs.unlinkSync(localFilePath);
      } catch (unlinkError) {
        console.error(
          "Error deleting local file after failed upload:",
          unlinkError.message
        );
      }
    }
    return null;
  }
};

/**
 * Deletes a file from Cloudinary using its public ID
 * @param {string} publicId - The public ID of the file to delete
 * @param {Object} options - Additional options for deletion
 * @param {string} [options.resource_type='image'] - Type of resource ('image' or 'video')
 * @returns {Promise<Object>} - Cloudinary deletion response
 */
const deleteFromCloudinary = async (
  publicId,
  options = { resource_type: "image" }
) => {
  try {
    // Validate publicId
    if (!publicId || typeof publicId !== "string") {
      throw new Error("Invalid public ID provided");
    }

    console.log(`Attempting to delete Cloudinary resource: ${publicId}`); // Debug log

    const result = await cloudinary.uploader.destroy(publicId, options);

    // Handle different Cloudinary response scenarios
    switch (result.result) {
      case "ok":
        console.log(`Successfully deleted: ${publicId}`);
        return result;
      case "not found":
        console.warn(`Resource not found: ${publicId}`);
        return { ...result, warning: "Resource not found" }; // Soft fail
      default:
        throw new Error(`Cloudinary deletion failed: ${result.result}`);
    }
  } catch (error) {
    console.error("Cloudinary deletion error:", {
      publicId,
      error: error.message,
      stack: error.stack,
    });
    throw new Error(`Failed to delete resource: ${error.message}`);
  }
};

/**
 * Extracts public ID from Cloudinary URL
 * @param {string} url - Cloudinary URL
 * @returns {string|null} - Extracted public ID or null if invalid URL
 */
const getPublicIdFromUrl = (url) => {
  if (!url) return null;

  try {
    // Example URL: https://res.cloudinary.com/demo/image/upload/v12345/sample.jpg
    const parts = url.split("/");
    const uploadIndex = parts.findIndex((part) => part === "upload");

    if (uploadIndex === -1 || uploadIndex >= parts.length - 1) {
      return null;
    }

    // The public ID is the part after 'upload' and before the file extension
    const publicIdWithExtension = parts[uploadIndex + 1];
    return publicIdWithExtension.split(".")[0];
  } catch (error) {
    console.error("Error extracting public ID:", error);
    return null;
  }
};

export { uploadOnCloudinary, deleteFromCloudinary, getPublicIdFromUrl };
