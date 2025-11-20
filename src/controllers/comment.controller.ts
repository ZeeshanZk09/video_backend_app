import mongoose from "mongoose";
import { Comment } from "@/models/comment.model";
import { ApiError } from "@/utils/ApiError";
import { ApiResponse } from "@/utils/ApiResponse";
import { asyncHandler } from "@/utils/asyncHandler";

const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  // Validate videoId
  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  // Pagination options
  const options = {
    page: parseInt(page as string),
    limit: parseInt(limit as string),
    sort: { createdAt: -1 }, // Sort by newest first
  };

  // Aggregate pipeline to get comments with owner details
  const comments = await Comment.aggregatePaginate(
    [
      {
        $match: {
          video: new mongoose.Types.ObjectId(videoId),
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
              $project: {
                username: 1,
                avatar: 1,
              },
            },
          ],
        },
      },
      {
        $addFields: {
          owner: {
            $first: "$owner",
          },
        },
      },
    ],
    options
  );

  if (!comments || comments.totalDocs === 0) {
    return res
      .status(200)
      .json(new ApiResponse(200, [], "No comments found for this video"));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, comments, "Comments fetched successfully"));
});

const addComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { content } = req.body;
  const userId = req.user?._id;

  // Validate input
  if (!content || content.trim() === "") {
    throw new ApiError(400, "Comment content is required");
  }

  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  // Create comment
  const comment = await Comment.create({
    content: content.trim(),
    video: videoId,
    owner: userId,
  });

  if (!comment) {
    throw new ApiError(500, "Failed to add comment");
  }

  // Populate owner details
  const populatedComment = await Comment.findById(comment._id).populate({
    path: "owner",
    select: "username avatar",
  });

  return res
    .status(201)
    .json(new ApiResponse(201, populatedComment, "Comment added successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { content } = req.body;
  const userId = req.user?._id;

  // Validate input
  if (!content || content.trim() === "") {
    throw new ApiError(400, "Comment content is required");
  }

  if (!mongoose.Types.ObjectId.isValid(commentId)) {
    throw new ApiError(400, "Invalid comment ID");
  }

  // Find and update comment
  const comment = await Comment.findOneAndUpdate(
    {
      _id: commentId,
      owner: userId, // Ensure only owner can update
    },
    {
      $set: {
        content: content.trim(),
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

  if (!comment) {
    throw new ApiError(
      404,
      "Comment not found or you don't have permission to edit"
    );
  }

  return res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment updated successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const userId = req.user?._id;

  // Validate commentId
  if (!mongoose.Types.ObjectId.isValid(commentId)) {
    throw new ApiError(400, "Invalid comment ID");
  }

  // Find and delete comment
  const comment = await Comment.findOneAndDelete({
    _id: commentId,
    owner: userId, // Ensure only owner can delete
  });

  if (!comment) {
    throw new ApiError(
      404,
      "Comment not found or you don't have permission to delete"
    );
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Comment deleted successfully"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
