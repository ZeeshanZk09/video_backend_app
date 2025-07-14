import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";

const createPlaylist = asyncHandler(async (req, res) => {
  let { name, description = "" } = req.body;
  const userId = req.user?._id;

  if (!name || name.trim() === "") {
    throw new ApiError(400, "Playlist name is required");
  }

  // Get thumbnail from request files
  const thumbnailLocalPath = req.file?.path;

  if (!thumbnailLocalPath) {
    throw new ApiError(400, "Thumbnail file is required");
  }

  // Upload thumbnail to Cloudinary
  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  if (!thumbnail) {
    throw new ApiError(500, "Failed to upload thumbnail");
  }

  const playlist = await Playlist.create({
    name: name.trim(),
    description: description?.trim(),
    owner: userId,
    videos: [],
    thumbnail: {
      url: thumbnail.url,
      publicId: thumbnail.public_id,
    },
  });

  if (!playlist) {
    // Delete uploaded thumbnail if playlist creation fails
    await deleteFromCloudinary(thumbnail.public_id);
    throw new ApiError(500, "Failed to create playlist");
  }

  // Populate owner details
  const populatedPlaylist = await Playlist.findById(playlist._id).populate({
    path: "owner",
    select: "username avatar",
  });

  return res
    .status(201)
    .json(
      new ApiResponse(201, populatedPlaylist, "Playlist created successfully")
    );
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { createdAt: -1 },
  };

  const playlists = await Playlist.aggregatePaginate(
    [
      {
        $match: {
          owner: new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $lookup: {
          from: "videos",
          localField: "videos",
          foreignField: "_id",
          as: "videos",
          pipeline: [
            {
              $project: {
                thumbnail: 1,
                title: 1,
                duration: 1,
              },
            },
          ],
        },
      },
      {
        $addFields: {
          videoCount: { $size: "$videos" },
        },
      },
    ],
    options
  );

  if (!playlists || playlists.totalDocs === 0) {
    return res
      .status(200)
      .json(new ApiResponse(200, [], "No playlists found for this user"));
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, playlists, "User playlists fetched successfully")
    );
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist ID");
  }

  const playlist = await Playlist.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(playlistId),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
        pipeline: [
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
              owner: { $first: "$owner" },
            },
          },
        ],
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
        owner: { $first: "$owner" },
        videoCount: { $size: "$videos" },
      },
    },
  ]);

  if (!playlist || playlist.length === 0) {
    throw new ApiError(404, "Playlist not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playlist[0], "Playlist fetched successfully"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  const userId = req.user?._id;

  if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid playlist or video ID");
  }

  // Check if user owns the playlist
  const playlist = await Playlist.findOne({
    _id: playlistId,
    owner: userId,
  });

  if (!playlist) {
    throw new ApiError(404, "Playlist not found or you don't have permission");
  }

  // Check if video already exists in playlist
  if (
    playlist.videos.some((vid) =>
      vid.equals(new mongoose.Types.ObjectId(videoId))
    )
  ) {
    throw new ApiError(400, "Video already exists in playlist");
  }

  // Add video to playlist
  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $addToSet: { videos: videoId },
    },
    { new: true }
  ).populate({
    path: "videos",
    select: "title thumbnail duration owner",
    populate: {
      path: "owner",
      select: "username avatar",
    },
  });

  if (!updatedPlaylist) {
    throw new ApiError(500, "Failed to add video to playlist");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedPlaylist,
        "Video added to playlist successfully"
      )
    );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  const userId = req.user?._id;

  if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid playlist or video ID");
  }

  // Check if user owns the playlist
  const playlist = await Playlist.findOne({
    _id: playlistId,
    owner: userId,
  });

  if (!playlist) {
    throw new ApiError(404, "Playlist not found or you don't have permission");
  }

  // Remove video from playlist
  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $pull: { videos: videoId },
    },
    { new: true }
  ).populate({
    path: "videos",
    select: "title thumbnail duration",
    populate: {
      path: "owner",
      select: "username avatar",
    },
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedPlaylist,
        "Video removed from playlist successfully"
      )
    );
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const userId = req.user?._id;

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist ID");
  }

  // First find the playlist to get the thumbnail info
  const playlist = await Playlist.findOne({
    _id: playlistId,
    owner: userId,
  });

  if (!playlist) {
    throw new ApiError(404, "Playlist not found or you don't have permission");
  }

  // Delete thumbnail from Cloudinary if exists
  if (playlist.thumbnail?.publicId) {
    await deleteFromCloudinary(playlist.thumbnail.publicId).catch((error) => {
      console.error("Failed to delete thumbnail from Cloudinary:", error);
      // Continue with playlist deletion even if thumbnail deletion fails
    });
  }

  // Now delete the playlist
  await Playlist.deleteOne({ _id: playlistId });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Playlist deleted successfully"));
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;
  const userId = req.user?._id;

  console.log("Request received:", { name, description, file: req.file });

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist ID");
  }

  const updateFields = {};

  // Handle name update
  if (name !== undefined) {
    if (typeof name === "string" && name.trim() === "") {
      throw new ApiError(400, "Playlist name cannot be empty");
    }
    updateFields.name = typeof name === "string" ? name.trim() : name;
  }

  // Handle description update
  if (description !== undefined) {
    updateFields.description =
      typeof description === "string" ? description.trim() : description;
  }

  // Handle thumbnail update
  const thumbnailLocalPath = req.file?.path;
  if (thumbnailLocalPath) {
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    if (!thumbnail) {
      throw new ApiError(500, "Failed to upload thumbnail");
    }

    const currentPlaylist = await Playlist.findById(playlistId);
    if (currentPlaylist?.thumbnail?.publicId) {
      await deleteFromCloudinary(currentPlaylist.thumbnail.publicId);
    }

    updateFields.thumbnail = {
      url: thumbnail.url,
      publicId: thumbnail.public_id,
    };
  }

  if (Object.keys(updateFields).length === 0) {
    const playlist = await Playlist.findById(playlistId).populate("owner");
    return res
      .status(200)
      .json(new ApiResponse(200, playlist, "No changes detected"));
  }

  const playlist = await Playlist.findOneAndUpdate(
    { _id: playlistId, owner: userId },
    { $set: updateFields },
    { new: true, runValidators: true }
  ).populate("owner");

  if (!playlist) {
    throw new ApiError(404, "Playlist not found or you don't have permission");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist updated successfully"));
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
