import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { videoId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const comments = await Comment.find({ video: videoId }).populate("video");
  return res
    .status(200)
    .json(new ApiResponse(200, comments, "Comments fetched successfully"));
});

const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video
  const { videoId } = req.params;
  const { content } = req.body;

  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  if (!content) {
    throw new ApiError(400, "Comment content cannot be empty");
  }

  const newComment = new Comment({
    content,
    video: videoId,
    owner: req.user._id,
  });

  await newComment.save();

  return res
    .status(200)
    .json(new ApiResponse(201, newComment, "Comment added successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment
  const { commentId } = req.params;
  const { updatedContent } = req.body;

  if (!mongoose.Types.ObjectId.isValid(commentId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const newComment = await Comment.findById(commentId).populate("content");

  if (!newComment) {
    new ApiResponse(404, "Invlaid Commnet ID");
  }

  newComment.content = updatedContent;

  return res
    .status(200)
    .json(new ApiResponse(201, {}, "Updated the comment successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment
  const { commentId } = req.params;

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const deleteComment = await Comment.findByIdAndDelete(commentId);

  return res
    .status(200)
    .json(new ApiResponse(201, {}, "Comment deleted Successfully"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
