import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  //TODO: create tweet
  // Step 1: Extract tweet content and any media from req.body and req.files (if applicable).
  // Step 2: Validate that required fields (e.g., content) are present.
  // Step 3: Create a new Tweet document with the content, media URL (if any), and owner (req.user._id).
  // Step 4: Save the tweet to the database.
  // Step 5: Return a 201 response with the created tweet data.

  const { content } = req.body;

  if (!content) {
    throw new ApiError(400, "Content is required");
  }

  if (!req.user._id) {
    throw new ApiError(400, "User need to login inorder to create a tweet");
  }

  const newTweet = new Tweet({
    content,
    owner: req.user._id,
  });

  await newTweet.save();

  return res
    .status(201)
    .json(new ApiResponse(201, newTweet, "Tweet created successfully"));
});

const getUserTweets = asyncHandler(async (req, res) => {
  // TODO: get user tweets
  // Step 1: Extract userId from req.params or req.user (for current user).
  // Step 2: Validate userId (check if it's a valid ObjectId).
  // Step 3: Query the Tweet collection for tweets where owner == userId.
  // Step 4: Optionally, sort tweets by createdAt (descending).
  // Step 5: Return a 200 response with the list of tweets.

  const { userId } = req.params;

  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid userId");
  }

  const tweets = await Tweet.find({ owner: userId }).sort({ createdAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, tweets, "User tweets retrieved successfully"));
});

const updateTweet = asyncHandler(async (req, res) => {
  //TODO: update tweet
  // Step 1: Extract tweetId from req.params and new content/media from req.body/req.files.
  // Step 2: Validate tweetId and that at least one updatable field is provided.
  // Step 3: Find the tweet by tweetId.
  // Step 4: Check if the requesting user is the owner of the tweet.
  // Step 5: Update the tweet's content/media as needed.
  // Step 6: Save the updated tweet.
  // Step 7: Return a 200 response with the updated tweet data.

  const { tweetId } = req.params;

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweetId");
  }

  const { content } = req.body;

  if (!content) {
    throw new ApiError(400, "Content is required");
  }

  const tweet = await Tweet.findById(tweetId);

  if (!tweet) {
    throw new ApiError(404, "Tweet not found");
  }

  if (String(tweet.owner) !== String(req.user._id)) {
    throw new ApiError(403, "You are not allowed to update this tweet");
  }

  tweet.content = content;

  await tweet.save();

  return res
    .status(200)
    .json(new ApiResponse(200, tweet, "Tweet updated successfully"));
});

const deleteTweet = asyncHandler(async (req, res) => {
  //TODO: delete tweet
  // Step 1: Extract tweetId from req.params.
  // Step 2: Validate tweetId.
  // Step 3: Find the tweet by tweetId.
  // Step 4: Check if the requesting user is the owner of the tweet.
  // Step 5: Delete the tweet from the database.
  // Step 6: Return a 200 response confirming deletion.

  const { tweetId } = req.params;

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(404, "not valid tweet id");
  }

  const tweet = await Tweet.findById(tweetId);

  if (!tweet) {
    throw new ApiError(404, "Tweet not found");
  }

  if (String(tweet.owner) !== String(req.user._id)) {
    throw new ApiError(404, "You are not allowed to delete the tweet");
  }
  await Tweet.findByIdAndDelete(tweetId);

  return res
    .status(200)
    .json(new ApiResponse(201, {}, "Tweet deleted successfully"));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
