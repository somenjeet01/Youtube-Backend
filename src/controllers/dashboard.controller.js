import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { lookup } from "dns";

const getChannelStats = asyncHandler(async (req, res) => {
  // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.

  // 1. Get the channel/user ID from req.user or req.params.
  // 2. Validate the channel/user ID.
  // 3. Count total videos uploaded by this user (Video collection).
  // 4. Sum total views for all videos uploaded by this user.
  // 5. Count total subscribers (Subscription collection where channel == user ID).
  // 6. Count total likes on all videos uploaded by this user (Like collection where video is in user's videos).
  // 7. Optionally, count total comments on all videos (if needed).
  // 8. Return all these stats in the response using ApiResponse.

  const userId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  // const totalVideos = await Video.countDocuments({ owner: userId });

  // const totalVideoAgg = await User.aggregate([
  //   { $match: { _id: mongoose.Types.ObjectId(userId) } },
  //   {
  //     $lookup: {
  //       from: "Video",
  //       localField: "_id",
  //       foreignField: "owner",
  //       as: "videos",
  //     },
  //   },
  // ]);

  const totalViewsAgg = await Video.aggregate([
    { $match: { owner: mongoose.Types.ObjectId(userId) } },
    { $group: { _id: null, totalViews: { $sum: "$views" } } },
  ]);
  const totalViews = totalViewsAgg[0] ? totalViewsAgg[0].totalViews : 0;


  const totalSubscribers = await Subscription.countDocuments({ channel: userId });

  const userVideos = await Video.aggregate([
    { $match: { owner: mongoose.Types.ObjectId(userId) } }
  ]);
  const videoIds = userVideos.map((video) => video._id);

  const totalLikesAgg = await Like.aggregate([
    { $match: { video: { $in: videoIds } } },
    { $group: { _id: null, totalLikes: { $sum: 1 } } },
  ]);
  const totalLikes = totalLikesAgg[0] ? totalLikesAgg[0].totalLikes : 0;  

  return res.status(200).json(new ApiResponse(200, "Channel stats fetched", {
    totalVideos: userVideos.length,
    totalViews,
    totalSubscribers,
    totalLikes
  }));

});

const getChannelVideos = asyncHandler(async (req, res) => {
  // TODO: Get all the videos uploaded by the channel

  // 1. Get the channel/user ID from req.user or req.params.
  // 2. Validate the channel/user ID.
  // 3. Query the Video collection to find all videos where owner == user ID.
  // 4. Optionally, sort the videos by createdAt or any other field.
  // 5. Optionally, populate related fields (like comments, likes, etc.) if needed.
  // 6. Return the list of videos in the response using ApiResponse.

  const userId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }   

  const videos = await Video.find({ owner: userId });

  return res
    .status(200)
    .json(
      new ApiResponse(200, "Channel videos fetched successfully", videos)
    );      
});



export { getChannelStats, getChannelVideos };
