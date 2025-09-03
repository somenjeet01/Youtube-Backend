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

   await newVideo.save();

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
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail

  // Step 1: Validate the videoId
  // - Check if the videoId is a valid MongoDB ObjectId.
  // - If not, throw an ApiError with a 400 status code and an appropriate message.

  // Step 2: Extract new video details from the request
  // - Get the new title, description from req.body.
  // - Get the new thumbnail file path from req.file (uploaded via multer middleware).

  // Step 3: Validate the presence of required fields
  // - Ensure that at least one of the fields (title, description, thumbnail) is provided.
  // - If none are provided, throw an ApiError with a 400 status code.

  // Step 4: Upload new thumbnail to Cloudinary (if provided)
  // - If a new thumbnail is provided, upload it to Cloudinary using the uploadOnCloudinary utility.
  // - Check if the upload was successful, if not, throw an ApiError with a 500 status code.

  // Step 5: Prepare the update object
  // - Create an update object with the new title, description, and thumbnail URL (if updated).
  // - Only include fields in the update object that are provided in the request.

  // Step 6: Update the video document in the database
  // - Use the Video model to find the video by videoId and update it with the prepared update object.
  // - If the video is not found, throw an ApiError with a 404 status code.

  // Step 7: Return a success response
  // - If the update is successful, return a 200 status code with the updated video data in the response.

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const { title, description, thumbnailNew } = req.body;

  if (!title && !description && !thumbnailNew) {
    throw new ApiError(400, "title, description or thumbnail must be provided");
  }

  const thumbnailLocalPath = req.file?.path;

  if (!thumbnailLocalPath) {
    throw new ApiError(400, "Thumbnail local path does not found");
  }

  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
  if (!thumbnail?.url) {
    throw new ApiError(500, "Failed to upload thumbnail");
  }


  const authorizedUser = await Video.findById(videoId);
  if (!authorizedUser) {
    throw new ApiError(404, "Video not found");
  }

  if (String(authorizedUser.owner) !== String(req.user._id)) {
    throw new ApiError(403, "Not authorized to 'update' this video");
  }

  const updateVideoDetails = await Video.findByIdAndUpdate(
    videoId,
    {
      title,
      description,
      thumbnail: thumbnail.url,
    },
    { new: true }
  );

  if (!updateVideoDetails) {
    throw new ApiError(404, "video not found by the ID");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, updateVideoDetails, "Video updated successfully")
    );
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video
    // Step 1: Extract videoId from request parameters
  // - Get the videoId from req.params.

  // Step 2: Validate the videoId
  // - Check if videoId is a valid MongoDB ObjectId.
  // - If not, throw an ApiError with a 400 status code and a message like "Invalid video ID".

  // Step 3: Find the video by videoId
  // - Use the Video model to find the video document by its ID.
  // - If the video does not exist, throw an ApiError with a 404 status code and a message like "Video not found".

  // Step 4: (Optional) Check if the requesting user is the owner of the video
  // - Compare req.user._id with video.owner.
  // - If not the owner, throw an ApiError with a 403 status code ("Not authorized to delete this video").

  // Step 5: Delete the video document
  // - Use the Video model to delete the video by its ID.

  // Step 6: (Optional) Remove the video from users' watchHistory or related collections if needed.

  // Step 7: Return a success response
  // - Return a 200 status code with a message like "Video deleted successfully".

  if (!isValidObjectId(videoId)){
    throw new ApiError(400, "Invalid video ID");
  }

  const deletedVideo = await Video.findById(videoId);
  if (!deletedVideo) {
    throw new ApiError(404, "Video not found");
  }

  if (String(deletedVideo.owner) !== String(req.user._id)) {
    throw new ApiError(403, "Not authorized to delete this video");
  }

  await Video.findByIdAndDelete(videoId);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Video deleted successfully"));

});


const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //get the video by the id
  //authorized the video is valid or not 
  //check the user of the video is only to make video published
  //if yes allow otherwise throught api error 404
  //const update the model with toggle button pressed update the mongoose model with key isPublished set to true.
  if(!isValidObjectId(videoId)){
    throw new ApiError(400, "Invalid video ID");
  }

  const authorizedUser = await Video.findById(videoId);
  if (!authorizedUser) {
    throw new ApiError(404, "Video not found");
  }

  if(String(req.user._id) !== String(authorizedUser.owner)) {
    throw new ApiError(403, "Not authorized to publish this video");
  }

  if(authorizedUser.isPublished) {
    throw new ApiError(400, "Video is already published");
  }

   authorizedUser.isPublished = true;
   await authorizedUser.save();

   return res
     .status(200)
     .json(new ApiResponse(200, authorizedUser, "Video published successfully"));

});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
