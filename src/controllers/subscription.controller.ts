import mongoose, { isValidObjectId } from "mongoose";
import { Subscription } from "@/models/subscription.model";
import { ApiError } from "@/utils/ApiError";
import { ApiResponse } from "@/utils/ApiResponse";
import { asyncHandler } from "@/utils/asyncHandler";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const subscriberId = req.user?._id;

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channel ID");
  }

  // Check if user is trying to subscribe to themselves
  if (channelId === subscriberId.toString()) {
    throw new ApiError(400, "You cannot subscribe to yourself");
  }

  // Check if subscription already exists
  const existingSubscription = await Subscription.findOne({
    channel: channelId,
    subscriber: subscriberId,
  });

  let subscriptionStatus;
  if (existingSubscription) {
    // Unsubscribe
    await Subscription.findByIdAndDelete(existingSubscription._id);
    subscriptionStatus = "unsubscribed";
  } else {
    // Subscribe
    await Subscription.create({
      channel: channelId,
      subscriber: subscriberId,
    });
    subscriptionStatus = "subscribed";
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { subscriptionStatus },
        `Successfully ${subscriptionStatus}`
      )
    );
});

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channel ID");
  }

  const options = {
    page: parseInt(page as string),
    limit: parseInt(limit as string),
    populate: {
      path: "subscriber",
      select: "username fullName avatar",
    },
  };

  const subscribers = await Subscription.paginate(
    { channel: channelId },
    options
  );

  if (!subscribers || subscribers.totalDocs === 0) {
    return res
      .status(200)
      .json(new ApiResponse(200, [], "No subscribers found for this channel"));
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, subscribers, "Subscribers fetched successfully")
    );
});

const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if (!mongoose.Types.ObjectId.isValid(subscriberId)) {
    throw new ApiError(400, "Invalid subscriber ID format");
  }

  const options = {
    page: parseInt(page as string),
    limit: parseInt(limit as string),
    sort: { createdAt: -1 },
    populate: {
      path: "channel",
      select: "username fullName avatar isVerified",
      // Remove nested populate if causing issues
    },
  };

  try {
    const result = await Subscription.paginate(
      { subscriber: subscriberId },
      options
    );

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          subscriptions: result.docs,
          totalSubscriptions: result.totalDocs,
          totalPages: result.totalPages,
          currentPage: result.page,
        },
        "Subscribed channels fetched successfully"
      )
    );
  } catch (error) {
    console.error("Subscription error:", error);
    throw new ApiError(500, "Failed to fetch subscriptions");
  }
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
