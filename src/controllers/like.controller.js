import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const userId = req.user?._id;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  // Check if like already exists
  const existingLike = await Like.findOne({
    video: videoId,
    likedBy: userId,
  });

  let likeStatus;
  if (existingLike) {
    // Unlike the video
    await Like.findByIdAndDelete(existingLike._id);
    likeStatus = "unLiked";
  } else {
    // Like the video
    await Like.create({
      video: videoId,
      likedBy: userId,
    });
    likeStatus = "liked";
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, { likeStatus }, `Video ${likeStatus} successfully`)
    );
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const userId = req.user?._id;

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid comment ID");
  }

  // Check if like already exists
  const existingLike = await Like.findOne({
    comment: commentId,
    likedBy: userId,
  });

  let likeStatus;
  if (existingLike) {
    // Unlike the comment
    await Like.findByIdAndDelete(existingLike._id);
    likeStatus = "unLiked";
  } else {
    // Like the comment
    await Like.create({
      comment: commentId,
      likedBy: userId,
    });
    likeStatus = "liked";
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, { likeStatus }, `Comment ${likeStatus} successfully`)
    );
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const userId = req.user?._id;

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweet ID");
  }

  // Check if like already exists
  const existingLike = await Like.findOne({
    tweet: tweetId,
    likedBy: userId,
  });

  let likeStatus;
  if (existingLike) {
    // Unlike the tweet
    await Like.findByIdAndDelete(existingLike._id);
    likeStatus = "unLiked";
  } else {
    // Like the tweet
    await Like.create({
      tweet: tweetId,
      likedBy: userId,
    });
    likeStatus = "liked";
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, { likeStatus }, `Tweet ${likeStatus} successfully`)
    );
});

const getLikedVideos = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const { page = 1, limit = 10 } = req.query;

  // Pagination options
  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    populate: [
      {
        path: "video",
        populate: {
          path: "owner",
          select: "username avatar",
        },
      },
    ],
  };

  // Get liked videos with pagination
  const likedVideos = await Like.paginate(
    {
      likedBy: userId,
      video: { $exists: true }, // Only get video likes
    },
    options
  );

  if (!likedVideos || likedVideos.totalDocs === 0) {
    return res
      .status(200)
      .json(new ApiResponse(200, [], "No liked videos found"));
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, likedVideos, "Liked videos fetched successfully")
    );
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
