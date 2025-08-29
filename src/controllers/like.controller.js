import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) {
    throw new ApiError(400, "Video id is missing");
  }

  const video = await Like.findOne({
    video: videoId,
    likedBy: req.user?._id,
  });

  if (video) {
    await Like.deleteOne({ _id: video._id });
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Video unliked successfully"));
  } else {
    await Like.create({
      video: videoId,
      likedBy: req.user?._id,
    });
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Video liked successfully"));
  }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  if (!commentId) {
    throw new ApiError(400, "Comment id is missing");
  }

  const comment = await Like.findOne({
    comment: commentId,
    likedBy: req.user?._id,
  });

  if (comment) {
    await Like.deleteOne({ _id: comment._id });
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Comment unliked successfully"));
  } else {
    await Like.create({
      comment: commentId,
      likedBy: req.user?._id,
    });
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Comment liked successfully"));
  }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  if (!tweetId) {
    throw new ApiError(400, "Tweet id is missing");
  }

  const tweet = await Like.findOne({
    tweet: tweetId,
    likedBy: req.user?._id,
  });

  if (tweet) {
    await Like.deleteOne({ _id: tweet._id });
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Tweet unliked successfully"));
  } else {
    await Like.create({
      tweet: tweetId,
      likedBy: req.user?._id,
    });
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Tweet liked successfully"));
  }
});

const getLikedVideos = asyncHandler(async (req, res) => {
  const likedVideos = await Like.aggregate([
    {
      $match: {
        likedBy: new mongoose.Types.ObjectId(req.user?._id),
        video: { $exists: true },
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "videoDetails",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "ownerDetails",
            },
          },
          {
            $unwind: "$ownerDetails",
          },
        ],
      },
    },
    {
      $unwind: "$videoDetails",
    },
    {
      $project: {
        _id: 0,
        videoDetails: {
          _id: 1,
          thumbnail: 1,
          title: 1,
          description: 1,
          duration: 1,
          createdAt: 1,
          views: 1,
          owner: 1,
          ownerDetails: {
            username: 1,
            fullName: 1,
            avatar: 1,
          },
        },
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(200, { likedVideos }, "Liked videos fetched successfully")
    );
});

export { toggleVideoLike, toggleCommentLike, toggleTweetLike, getLikedVideos };
