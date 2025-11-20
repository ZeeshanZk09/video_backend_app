import mongoose, { isValidObjectId } from "mongoose";
import { IVideo, Video } from "@/models/video.model";
import { ApiError } from "@/utils/ApiError";
import { ApiResponse } from "@/utils/ApiResponse";
import { asyncHandler } from "@/utils/asyncHandler";
import {
  getPublicIdFromUrl,
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "@/utils/cloudinary.js";
import { Request } from "express";
import cloudinary from "cloudinary";
const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID format");
  }

  try {
    // 1. Basic video existence check
    const videoExists = await Video.findById(videoId);
    if (!videoExists) {
      throw new ApiError(404, "Video does not exist");
    }

    // 2. Check viewing permissions
    const isOwner = req.user?._id.equals(videoExists.owner);
    const isAdmin = req.user?.isAdmin;
    const shouldShowUnpublished = isOwner || isAdmin;

    // 3. Main aggregation pipeline
    const pipeline = [
      {
        $match: {
          _id: new mongoose.Types.ObjectId(videoId),
          $or: [{ isPublished: true }, ...(shouldShowUnpublished ? [{}] : [])],
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "owner",
          pipeline: [
            {
              $addFields: {
                subscribersCount: {
                  $cond: {
                    if: { $isArray: "$subscribers" },
                    then: { $size: "$subscribers" },
                    else: 0,
                  },
                },
              },
            },
            {
              $project: {
                username: 1,
                avatar: 1,
                fullName: 1,
                subscribersCount: 1,
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: "likes",
          localField: "_id",
          foreignField: "video",
          as: "likes",
        },
      },
      {
        $addFields: {
          owner: { $first: "$owner" },
          likesCount: {
            $cond: {
              if: { $isArray: "$likes" },
              then: { $size: "$likes" },
              else: 0,
            },
          },
          isLiked: req.user?._id
            ? {
                $in: [
                  new mongoose.Types.ObjectId(req.user._id),
                  "$likes.likedBy",
                ],
              }
            : false,
        },
      },
      { $project: { likes: 0, "owner.subscribers": 0 } },
    ];

    const [video] = await Video.aggregate(pipeline);

    if (!video) {
      throw new ApiError(
        404,
        shouldShowUnpublished
          ? "Video data could not be loaded"
          : "Video is not currently published"
      );
    }

    // 4. Increment views (async for published videos)
    if (video.isPublished) {
      Video.findByIdAndUpdate(videoId, { $inc: { views: 1 } }).catch((err) =>
        console.error("View increment failed:", err)
      );
    }

    return res
      .status(200)
      .json(new ApiResponse(200, video, "Video fetched successfully"));
  } catch (error: any) {
    console.error("Video fetch failed:", {
      videoId,
      userId: req.user?._id,
      error: error.message,
    });
    throw error instanceof ApiError
      ? error
      : new ApiError(500, "Failed to load video data");
  }
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description } = req.body;
  const userId = req.user?._id;

  // Validate video ID
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID format");
  }

  const updateFields: Partial<IVideo> = {};
  try {
    // Check video exists and user has permission
    const existingVideo = await Video.findOne({ _id: videoId, owner: userId });
    if (!existingVideo) {
      throw new ApiError(404, "Video not found or no permission");
    }

    // Prepare update fields

    // Handle title update
    if (title !== undefined) {
      if (!title.trim()) throw new ApiError(400, "Title cannot be empty");
      updateFields.title = title.trim();
    }

    // Handle description update
    if (description !== undefined) {
      updateFields.description = description.trim();
    }

    // Handle thumbnail update
    if ((req.files as any)?.thumbnail?.[0]?.path) {
      const thumbnail = (await uploadOnCloudinary(
        (req.files as any).thumbnail[0].path,
        { resourceType: "video" }
      )) as cloudinary.UploadApiResponse;
      if (!thumbnail) throw new ApiError(500, "Thumbnail upload failed");

      updateFields.thumbnail = {
        url: thumbnail.url,
        publicId: thumbnail.public_id,
      };

      // Delete old thumbnail if exists
      if (existingVideo.thumbnail?.publicId) {
        await deleteFromCloudinary(existingVideo.thumbnail.publicId);
      }
    }

    // Handle video file update
    if ((req.files as any)?.videoFile?.[0]?.path) {
      const videoFile = await uploadOnCloudinary(
        (req.files as any).videoFile[0].path,
        { resourceType: "video" }
      );
      if (!videoFile) throw new ApiError(500, "Video upload failed");

      updateFields.videoFile = {
        url: videoFile.url,
        publicId: videoFile.public_id,
      };
      updateFields.duration = videoFile.duration;

      // Delete old video if exists
      if (existingVideo.videoFile?.publicId) {
        await deleteFromCloudinary(existingVideo.videoFile.publicId, {
          resource_type: "video",
        });
      }
    }

    // Perform the update
    const updatedVideo = await Video.findByIdAndUpdate(videoId, updateFields, {
      new: true,
      runValidators: true,
    }).populate({ path: "owner", select: "username avatar" });

    return res
      .status(200)
      .json(new ApiResponse(200, updatedVideo, "Video updated successfully"));
  } catch (error: any) {
    console.error("Video update error:", {
      videoId,
      error: error.message,
      stack: error.stack,
    });

    // Cleanup if error occurred during upload
    if (updateFields.thumbnail?.publicId) {
      await deleteFromCloudinary(updateFields.thumbnail.publicId);
    }
    if (updateFields.videoFile?.publicId) {
      await deleteFromCloudinary(updateFields.videoFile.publicId, {
        resource_type: "video",
      });
    }

    throw error instanceof ApiError
      ? error
      : new ApiError(500, "Failed to update video");
  }
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const userId = req.user?._id;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const video = await Video.findOne({
    _id: videoId,
    owner: userId, // Only owner can toggle
  });

  if (!video) {
    throw new ApiError(404, "Video not found or you don't have permission");
  }

  video.isPublished = !video.isPublished;
  await video.save();

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        video,
        `Video ${video.isPublished ? "published" : "unpublished"} successfully`
      )
    );
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  const userId = req.user?._id;

  if (!title?.trim()) {
    throw new ApiError(400, "Title is required");
  }

  // Validate files
  if (!(req.files as any)?.videoFile?.[0]?.path) {
    throw new ApiError(400, "Video file is required");
  }
  if (!(req.files as any)?.thumbnail?.[0]?.path) {
    throw new ApiError(400, "Thumbnail is required");
  }

  try {
    // Upload files in parallel
    const [videoFile, thumbnail] = await Promise.all([
      uploadOnCloudinary((req.files as any).videoFile[0].path),
      uploadOnCloudinary((req.files as any).thumbnail[0].path),
    ]);

    if (!videoFile || !thumbnail) {
      throw new ApiError(500, "Failed to upload media files");
    }

    // Create video with proper structure
    const video = await Video.create({
      title: title.trim(),
      description: description?.trim(),
      duration: videoFile.duration,
      videoFile: {
        url: videoFile.url,
        publicId: videoFile.public_id, // Use public_id directly from Cloudinary response
      },
      thumbnail: { url: thumbnail.url, publicId: thumbnail.public_id },
      owner: userId,
      isPublished: false,
    });

    return res
      .status(201)
      .json(new ApiResponse(201, video, "Video published successfully"));
  } catch (error: any) {
    console.error("Publish error:", error);
    throw new ApiError(500, error.message || "Video publishing failed");
  }
});

// Improved getAllVideos with better error handling
const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

  try {
    if (!userId) {
      throw new ApiError(401, "User ID is required");
    }
    const match: { [key: string]: any } = { isPublished: true };
    if (userId && isValidObjectId(userId as string)) {
      match.owner = new mongoose.Types.ObjectId(userId as string);
    }
    if (query) {
      match.$or = [
        { title: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page as string));
    const pageLimit = Math.min(100, Math.max(1, parseInt(limit as string)));
    const skip = (pageNum - 1) * pageLimit;

    const pipeline = [
      { $match: match },
      { $sort: { createdAt: -1 as 1 | -1 } },
      { $skip: skip },
      { $limit: pageLimit },
      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "owner",
        },
      },
      { $addFields: { owner: { $first: "$owner" } } },
      {
        $project: {
          "owner.username": 1,
          "owner.avatar": 1,
          title: 1,
          description: 1,
          thumbnail: 1,
          videoFile: 1,
          duration: 1,
          views: 1,
          isPublished: 1,
          createdAt: 1,
        },
      },
    ];

    const videos = await Video.aggregate(pipeline);

    const totalVideos = await Video.countDocuments(match);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          videos,
          page: pageNum,
          limit: pageLimit,
          total: totalVideos,
          totalPages: Math.ceil(totalVideos / pageLimit),
        },
        "Videos fetched successfully"
      )
    );
  } catch (error) {
    console.error("Get videos error:", error);
    throw new ApiError(500, "Failed to fetch videos");
  }
});

// Improved deleteVideo with Cloudinary cleanup
const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const userId = req.user?._id;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  try {
    const video = await Video.findOneAndDelete({ _id: videoId, owner: userId });

    if (!video) {
      throw new ApiError(404, "Video not found or no permission");
    }

    // Delete from Cloudinary
    await Promise.all([
      video.videoFile?.publicId &&
        deleteFromCloudinary(video.videoFile.publicId, {
          resource_type: "video",
        }),
      video.thumbnail?.publicId &&
        deleteFromCloudinary(video.thumbnail.publicId),
    ]);

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Video deleted successfully"));
  } catch (error) {
    console.error("Delete video error:", error);
    throw new ApiError(500, "Failed to delete video");
  }
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
