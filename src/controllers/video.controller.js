import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  console.log(req);
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  //TODO: get all videos based on query, sort, pagination
  //  page=2 → pagination

  console.log(req.query);

  const pipeline = [];

  //match for filtering
  const matchStage = {};

  if (query) {
    matchStage.$or = [
      { title: { $regex: query, $options: "i" } },
      { description: { $regex: query, $options: "i" } },
    ];
  }

  // only get published videos
  matchStage.isPublished = true;

  if (userId) {
    if (!isValidObjectId(userId)) {
      throw new ApiError(400, "Invalid userId");
    }

    matchStage.owner = new mongoose.Types.ObjectId(userId);
  }

  pipeline.push({ $match: matchStage });

  //TODO: add sort stage
  const sortStage = {};

  if (sortBy && sortType) {
    sortStage[sortBy] = sortType === "asc" ? 1 : -1;
  } else {
    sortStage.createdAt = -1;
  }

  pipeline.push({ $sort: sortStage });

  //lookup for owners details
  pipeline.push({
    $lookup: {
      from: "users",
      localField: "owner",
      foreignField: "_id",
      as: "ownerDetails",
      pipeline: [
        {
          $project: {
            userName: 1,
            avatar: 1,
          },
        },
      ],
    },
  });

  pipeline.push({
    $unwind: "$ownerDetails",
  });

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  };

  const videos = await Video.aggregatePaginate(pipeline, options);

  if (videos.docs.length === 0) {
    return res.status(200).json(new ApiResponse(200, {}, "No videos found"));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, videos, "Videos retrieved successfully"));
});

const publishAVideo = asyncHandler(async (req, res) => {
  // Get title and description from request body
  // Get video file and thumbnail paths from multer middleware (req.files)
  // Validate that all required fields (title, description, videoFile, thumbnail) are present. If not, throw an ApiError.
  // Upload video file to Cloudinary.
  // Upload thumbnail to Cloudinary.
  // Check if uploads were successful. If not, throw an ApiError.
  // Get the duration of the video from the Cloudinary response.
  // Create a new video object using the Video model with the data:
  //   - videoFile: Cloudinary URL of the video
  //   - thumbnail: Cloudinary URL of the thumbnail
  //   - title, description from req.body
  //   - duration from Cloudinary response
  //   - owner: from req.user._id (from verifyJWT middleware)
  // Save the new video document to the database.
  // Return a 201 Created response with the created video data.
  // const { title, description } = req.body;
  // TODO: get video, upload to cloudinary, create video
  console.log("BODY:", req.body);
  console.log("FILES:", req.files);


  const { title, description } = req.body;

  if (!title || !description) {
    throw new ApiError(400, "Title and description are required");
  }

  // const pipeline = [];

  const videoFileLocalPath = req.files?.videoFile?.[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

  if (!thumbnailLocalPath) {
    throw new ApiError(400, "Video thumbnail  file are required");
  }

  if (!videoFileLocalPath) {
    throw new ApiError(400, " video file are required");
  }

  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
  const videoFile = await uploadOnCloudinary(videoFileLocalPath);

  console.log("Cloudinary thumbnail response:", thumbnail.url);
  console.log("Cloudinary video file response:", videoFile.url);


  if (!thumbnail?.url) {
    throw new ApiError(500, "Thumbnail upload failed, please try again later");
  }

  if (!videoFile?.url) {
    throw new ApiError(500, "Video upload failed, please try again later");
  }

  // pipeline.push({
  //   $lookup: {
  //     from: "users",
  //     localField: "owner",
  //     foreignField: "_id",
  //     as: "ownerDetails",
  //     pipeline: [
  //       {
  //         $project: {
  //           userName: 1,
  //           avatar: 1,
  //         },
  //       },
  //     ],
  //   },
  // });

  // pipeline.push({
  //   $unwind: "$ownerDetails",
  // });

  const newVideo = new Video({
    title,
    description,
    isPublished: true,
    thumbnail: thumbnail.url,
    videoFile: videoFile.url,
    duration: videoFile.duration || 0, // Assuming duration is returned by Cloudinary
    owner: req.user?._id,
    isPublished: true, // from verifyJWT middleware
  });

  // await newVideo.save();

  if (!newVideo) {
    throw new ApiError(500, "Something went wrong while publishing the video");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, newVideo, "Video published successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const video = await Video.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(videoId),
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
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $lookup: {
              from: "subscriptions",
              localField: "_id",
              foreignField: "channel",
              as: "subscribers",
            },
          },
          {
            $addFields: {
              subscribersCount: {
                $size: "$subscribers",
              },
              isSubscribed: {
                $cond: {
                  if: {
                    $in: [req.user?._id, "$subscribers.subscriber"],
                  },
                  then: true,
                  else: false,
                },
              },
            },
          },
          {
            $project: {
              userName: 1,
              avatar: 1,
              subscribersCount: 1,
              isSubscribed: 1,
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
        likesCount: {
          $size: "$likes",
        },
        isLiked: {
          $cond: {
            if: { $in: [req.user?._id, "$likes.likedBy"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        videoFile: 1,
        title: 1,
        description: 1,
        views: 1,
        createdAt: 1,
        duration: 1,
        thumbnail: 1,
        owner: 1,
        likesCount: 1,
        isLiked: 1,
      },
    },
  ]);

  if (!video.length) {
    throw new ApiError(404, "Video not found");
  }

  // Increment view count
  await Video.findByIdAndUpdate(videoId, {
    $inc: { views: 1 },
  });

  // Add to watch history
  await User.findByIdAndUpdate(req.user?._id, {
    $addToSet: { watchHistory: videoId },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, video[0], "Video fetched successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  // ... existing code
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
