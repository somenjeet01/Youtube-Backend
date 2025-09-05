import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: toggle like on video

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const existingLike = await Like.findOne({
    video: videoId,
    likedBy: req.user._id,
  });
  if (existingLike) {
    return res
      .status(200)
      .json(new ApiResponse(201, {}, "video already liked"));
  }

  const newLike = new Like({ video: videoId, likedBy: req.user._id });
  await newLike.save();
  return res.status(200).json(new ApiResponse(true, {}, " You Liked video"));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  //TODO: toggle like on comment

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid comment ID");
  }

  const existingCommentLike = await Like.findOne({
    comment: commentId,
    likedBy: req.user._id,
  });

  if (existingCommentLike) {
    return res
      .status(200)
      .json(new ApiResponse(201, {}, "Comment already liked"));
  }

  if (existingCommentLike) {
    return res
      .status(200)
      .json(new ApiResponse(201, {}, "You liked the comment"));
  }

  const newLike = new Like({ comment: commentId, likedBy: req.user._id });
  await newLike.save();
  return res
    .status(200)
    .json(new ApiResponse(201, {}, "You Liked the comment"));
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  //TODO: toggle like on tweet
  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweet ID");
  }

  const existingTweetLike = await Like.findOne({
    tweet: tweetId,
    likedBy: req.user._id,
  });

  if (existingTweetLike) {
    return res
      .status(200)
      .json(new ApiResponse(201, {}, "You have liked the tweet"));
  }

  const newLike = new Like({ tweet: tweetId, likedBy: req.user._id });
  await newLike.save();
  return res.status(200).json(new ApiResponse(201, {}, "You Liked tweet"));
});

const getLikedVideos = asyncHandler(async (req, res) => {
  //TODO: get all liked videos

  const { userId } = req.user._id;

  console.log(userId);

  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  const likedVideos = await Like.find({ likedBy: userId, video: { $ne: null } })
    .populate("video")
    .exec();

  if (likedVideos.length === 0 || !likedVideos) {
    return res
      .status(200)
      .json(new ApiResponse(201, likedVideos, "No liked videos found"));
  }

  return res
    .status(200)
    .json(
      new ApiResponse(201, likedVideos, "Liked videos fetched successfully")
    );
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
