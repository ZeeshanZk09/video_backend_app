import mongoose from "mongoose";
import { Video } from "@/models/video.model";
import { Subscription } from "@/models/subscription.model";
import { Like } from "@/models/like.model";
import { ApiError } from "@/utils/ApiError";
import { ApiResponse } from "@/utils/ApiResponse";
import { asyncHandler } from "@/utils/asyncHandler";

const getChannelStats = asyncHandler(async (req, res) => {
  const channelId = req.user?._id; // Assuming the logged-in user is the channel owner

  if (!mongoose.Types.ObjectId.isValid(channelId)) {
    throw new ApiError(400, "Invalid channel ID");
  }

  // Get total video views using aggregation
  const totalViews = await Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $group: {
        _id: null,
        totalViews: { $sum: "$views" },
      },
    },
  ]);

  // Get total subscribers count
  const totalSubscribers = await Subscription.countDocuments({
    channel: channelId,
  });

  // Get total videos count
  const totalVideos = await Video.countDocuments({
    owner: channelId,
  });

  // Get total likes on all videos
  const totalLikes = await Like.aggregate([
    {
      $match: {
        video: {
          $in: await Video.find({ owner: channelId }).distinct("_id"),
        },
      },
    },
    {
      $group: {
        _id: null,
        count: { $sum: 1 },
      },
    },
  ]);

  // Prepare the stats object
  const stats = {
    totalViews: totalViews[0]?.totalViews || 0,
    totalSubscribers: totalSubscribers || 0,
    totalVideos: totalVideos || 0,
    totalLikes: totalLikes[0]?.count || 0,
  };

  return res
    .status(200)
    .json(new ApiResponse(200, stats, "Channel stats fetched successfully"));
});

const getChannelVideos = asyncHandler(async (req, res) => {
  const channelId = req.user?._id; // Assuming the logged-in user is the channel owner
  const {
    page = "1",
    limit = "10",
    sortBy = "createdAt",
    sortType = "desc",
  } = req.query as {
    page?: string;
    limit?: string;
    sortBy?: string;
    sortType?: string;
  };

  if (!mongoose.Types.ObjectId.isValid(channelId)) {
    throw new ApiError(400, "Invalid channel ID");
  }

  // Sorting options
  const sortOptions: Record<string, number> = {};
  const sortByKey = String(sortBy || "createdAt");
  const sortOrder = String(sortType || "desc") === "desc" ? -1 : 1;
  sortOptions[sortByKey] = sortOrder;

  // Pagination options
  const options = {
    page: parseInt(page as string, 10),
    limit: parseInt(limit as string, 10),
    sort: sortOptions,
    populate: {
      path: "owner",
      select: "username avatar",
    },
  };

  // Additional fields to include
  const videos = await Video.aggregatePaginate(
    [
      {
        $match: {
          owner: new mongoose.Types.ObjectId(channelId),
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
          likesCount: { $size: "$likes" },
          isPublished: {
            $cond: {
              if: { $eq: ["$isPublished", true] },
              then: true,
              else: false,
            },
          },
        },
      },
      {
        $project: {
          likes: 0, // Exclude the likes array from final output
        },
      },
    ],
    options
  );

  if (!videos || videos.totalDocs === 0) {
    return res
      .status(200)
      .json(new ApiResponse(200, [], "No videos found for this channel"));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, videos, "Channel videos fetched successfully"));
});

export { getChannelStats, getChannelVideos };
