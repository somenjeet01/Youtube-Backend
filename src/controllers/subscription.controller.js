// import mongoose, {isValidObjectId} from "mongoose"
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const subscriberId = req.user._id;

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channel ID");
  }

  const existingSubscription = await Subscription.findOne({
    channel: channelId,
    subscriber: subscriberId,
  });

  if (existingSubscription) {
    await Subscription.deleteOne({ _id: existingSubscription._id });
    return res.status(200).json(new ApiResponse(200, { message: "Unsubscribed successfully" }));
  }

  const newSubscription = new Subscription({
    channel: channelId,
    subscriber: subscriberId,
  });
  await newSubscription.save();
  res.status(201).json(new ApiResponse(201, { message: "Subscribed successfully" }));
});

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channel ID");
  }

  const subscribers = await Subscription.find({ channel: channelId }).populate(
    "subscriber",
    "username email"
  );
  res
    .status(200)
    .json(
      new ApiResponse(201, { subscribers }, "Subscribers fetched successfully")
    );
});

const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;

  if (!isValidObjectId(subscriberId)) {
    throw new ApiError(400, "Invalid channel ID");
  }

  const SubscribedChannels = await Subscription.find({
    subscriber: subscriberId,
  }).populate("subscriber", "username email");
  res
    .status(200)
    .json(
      new ApiResponse(
        201,
        { SubscribedChannels },
        "Subscribed channels fetched successfully"
      )
    );
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
