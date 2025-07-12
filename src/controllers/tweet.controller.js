import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const userId = req.user?._id;

  if (!content || content.trim() === "") {
    throw new ApiError(400, "Tweet content is required");
  }

  const tweet = await Tweet.create({
    content: content.trim(),
    owner: userId,
  });

  if (!tweet) {
    throw new ApiError(500, "Failed to create tweet");
  }

  // Populate owner details
  const populatedTweet = await Tweet.findById(tweet._id).populate({
    path: "owner",
    select: "username avatar",
  });

  return res
    .status(201)
    .json(new ApiResponse(201, populatedTweet, "Tweet created successfully"));
});

const getUserTweets = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { createdAt: -1 }, // Newest first
    populate: {
      path: "owner",
      select: "username avatar",
    },
  };

  const tweets = await Tweet.paginate({ owner: userId }, options);

  if (!tweets || tweets.totalDocs === 0) {
    return res
      .status(200)
      .json(new ApiResponse(200, [], "No tweets found for this user"));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, tweets, "User tweets fetched successfully"));
});

const updateTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const { content } = req.body;
  const userId = req.user?._id;

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweet ID");
  }

  if (!content || content.trim() === "") {
    throw new ApiError(400, "Tweet content is required");
  }

  const tweet = await Tweet.findOneAndUpdate(
    {
      _id: tweetId,
      owner: userId, // Only owner can update
    },
    {
      $set: {
        content: content.trim(),
        edited: true, // Mark as edited
      },
    },
    {
      new: true,
      runValidators: true,
    }
  ).populate({
    path: "owner",
    select: "username avatar",
  });

  if (!tweet) {
    throw new ApiError(404, "Tweet not found or you don't have permission");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, tweet, "Tweet updated successfully"));
});

const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const userId = req.user?._id;

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweet ID");
  }

  const tweet = await Tweet.findOneAndDelete({
    _id: tweetId,
    owner: userId, // Only owner can delete
  });

  if (!tweet) {
    throw new ApiError(404, "Tweet not found or you don't have permission");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Tweet deleted successfully"));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
