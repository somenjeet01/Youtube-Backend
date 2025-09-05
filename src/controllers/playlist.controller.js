// import mongoose, { isValidObjectId } from "mongoose";
// import { Playlist } from "../models/playlist.model.js";
// import { ApiError } from "../utils/ApiError.js";
// import { ApiResponse } from "../utils/ApiResponse.js";
// import { asyncHandler } from "../utils/asyncHandler.js";

// const createPlaylist = asyncHandler(async (req, res) => {
//   const { name, description } = req.body;
//   const userId = req.user?._id;

//   if (!name) {
//     throw new ApiError(400, "Name is required");
//   }

//   const playlist = await Playlist.create({
//     name,
//     description,
//     owner: userId,
//   });

//   if (!playlist) {
//     throw new ApiError(500, "Failed to create playlist");
//   }

//   return res
//     .status(201)
//     .json(new ApiResponse(200, playlist, "Playlist created successfully"));
// });

// const getUserPlaylists = asyncHandler(async (req, res) => {
//   const { userId } = req.params;

//   if (!isValidObjectId(userId)) {
//     throw new ApiError(400, "Invalid user id");
//   }

//   const playlists = await Playlist.aggregate([
//     {
//       $match: {
//         owner: new mongoose.Types.ObjectId(userId),
//       },
//     },
//     {
//       $lookup: {
//         from: "videos",
//         localField: "videos",
//         foreignField: "_id",
//         as: "videos",
//       },
//     },
//     {
//       $addFields: {
//         totalVideos: { $size: "$videos" },
//         totalDuration: {
//           $sum: "$videos.duration",
//         },
//       },
//     },
//   ]);

//   return res
//     .status(200)
//     .json(
//       new ApiResponse(200, playlists, "User playlists fetched successfully")
//     );
// });

// const getPlaylistById = asyncHandler(async (req, res) => {
//   const { playlistId } = req.params;

//   if (!isValidObjectId(playlistId)) {
//     throw new ApiError(400, "Invalid playlist id");
//   }

//   const playlist = await Playlist.aggregate([
//     {
//       $match: {
//         _id: new mongoose.Types.ObjectId(playlistId),
//       },
//     },
//     {
//       $lookup: {
//         from: "videos",
//         localField: "videos",
//         foreignField: "_id",
//         as: "videos",
//       },
//     },
//     {
//       $addFields: {
//         totalVideos: { $size: "$videos" },
//         totalDuration: {
//           $sum: "$videos.duration",
//         },
//       },
//     },
//   ]);

//   if (!playlist.length) {
//     throw new ApiError(404, "Playlist not found");
//   }

//   return res
//     .status(200)
//     .json(new ApiResponse(200, playlist[0], "Playlist fetched successfully"));
// });

// const addVideoToPlaylist = asyncHandler(async (req, res) => {
//   const { playlistId, videoId } = req.params;

//   if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
//     throw new ApiError(400, "Invalid playlist id or video id");
//   }

//   const playlist = await Playlist.findById(playlistId);

//   if (!playlist) {
//     throw new ApiError(404, "Playlist not found");
//   }

//   if (playlist.owner.toString() !== req.user?._id.toString()) {
//     throw new ApiError(403, "Only owner can add video to playlist");
//   }

//   const videoExists = playlist.videos.includes(videoId);

//   if (videoExists) {
//     throw new ApiError(409, "Video already exists in playlist");
//   }

//   const updatedPlaylist = await Playlist.findByIdAndUpdate(
//     playlistId,
//     {
//       $push: {
//         videos: videoId,
//       },
//     },
//     { new: true }
//   ).populate("videos");

//   return res
//     .status(200)
//     .json(
//       new ApiResponse(
//         200,
//         updatedPlaylist,
//         "Video added to playlist successfully"
//       )
//     );
// });

// const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
//   const { playlistId, videoId } = req.params;

//   if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
//     throw new ApiError(400, "Invalid playlist id or video id");
//   }

//   const playlist = await Playlist.findById(playlistId);

//   if (!playlist) {
//     throw new ApiError(404, "Playlist not found");
//   }

//   if (playlist.owner.toString() !== req.user?._id.toString()) {
//     throw new ApiError(403, "Only owner can remove video from playlist");
//   }

//   const videoExists = playlist.videos.includes(videoId);

//   if (!videoExists) {
//     throw new ApiError(404, "Video not found in playlist");
//   }

//   const updatedPlaylist = await Playlist.findByIdAndUpdate(
//     playlistId,
//     {
//       $pull: {
//         videos: videoId,
//       },
//     },
//     { new: true }
//   ).populate("videos");

//   return res
//     .status(200)
//     .json(
//       new ApiResponse(
//         200,
//         updatedPlaylist,
//         "Video removed from playlist successfully"
//       )
//     );
// });

// const deletePlaylist = asyncHandler(async (req, res) => {
//   const { playlistId } = req.params;

//   if (!isValidObjectId(playlistId)) {
//     throw new ApiError(400, "Invalid playlist id");
//   }

//   const playlist = await Playlist.findById(playlistId);

//   if (!playlist) {
//     throw new ApiError(404, "Playlist not found");
//   }

//   if (playlist.owner.toString() !== req.user?._id.toString()) {
//     throw new ApiError(403, "Only owner can delete playlist");
//   }

//   await Playlist.findByIdAndDelete(playlistId);

//   return res
//     .status(200)
//     .json(new ApiResponse(200, {}, "Playlist deleted successfully"));
// });

// const updatePlaylist = asyncHandler(async (req, res) => {
//   const { playlistId } = req.params;
//   const { name, description } = req.body;

//   if (!isValidObjectId(playlistId)) {
//     throw new ApiError(400, "Invalid playlist id");
//   }

//   const playlist = await Playlist.findById(playlistId);

//   if (!playlist) {
//     throw new ApiError(404, "Playlist not found");
//   }

//   if (playlist.owner.toString() !== req.user?._id.toString()) {
//     throw new ApiError(403, "Only owner can update playlist");
//   }

//   const updatedPlaylist = await Playlist.findByIdAndUpdate(
//     playlistId,
//     {
//       $set: {
//         name,
//         description,
//       },
//     },
//     { new: true }
//   );

//   return res
//     .status(200)
//     .json(
//       new ApiResponse(200, updatedPlaylist, "Playlist updated successfully")
//     );
// });

// export {
//   createPlaylist,
//   getUserPlaylists,
//   getPlaylistById,
//   addVideoToPlaylist,
//   removeVideoFromPlaylist,
//   deletePlaylist,
//   updatePlaylist,
// };

import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  // TODO: create playlist.
  // select the video from the you want to add to the playlist.
  // you can add multiple videos while creating the playlist.
  // you can also create an empty playlist and add videos later.
  // return the created playlist in the response.
  // playlist schema: name, description, owner, videos (array of video ids), createdAt, updatedAt

  const userId = req.user?._id;

  if (!name || !description) {
    throw new ApiError(400, "Name and description are required");
  }
  console.log(req.body);

  const playlist = await Playlist.create({
    name,
    description,
    owner: userId,
  });

  if (!playlist) {
    throw new ApiError(500, "Playlist not created");
  }

  await playlist.save();

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist created successfully"));
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  //TODO: get playlist by id
  if (!isValidObjectId(playlistId)) {
    throw new ApiError(404, "Invalid token ID");
  }

  const playlist = await Playlist.findById(playlistId).populate("videos");

  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist fetched successfully"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(404, "Invalid playlist ID");
  }

  if (!isValidObjectId(videoId)) {
    throw new ApiError(404, "Invalid video ID");
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  const videoExists = playlist.videos.includes(videoId);

  if (videoExists) {
    throw new ApiError(409, "Video already exists in playlist");
  }

  playlist.videos.push(videoId);
  await playlist.save();

  return res
    .status(200)
    .json(
      new ApiResponse(200, playlist, "Video added to playlist successfully")
    );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  // TODO: remove video from playlist

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(404, "Invalid playlist ID");
  }

  if (!isValidObjectId(videoId)) {
    throw new ApiError(404, "Invalid video ID");
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  const videoExists = playlist.videos.includes(videoId);

  if (!videoExists) {
    throw new ApiError(404, "Video not found in playlist");
  }

  playlist.videos.pull(videoId);
  await playlist.save();

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { removedVideoId: videoId },
        "Video removed from playlist successfully"
      )
    );
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  // TODO: delete playlist

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(404, "Invalid Token ID");
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(404, "User playlist not found");
  }

  if (playlist.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(403, "Only owner can delete playlist");
  }

  await Playlist.findByIdAndDelete(playlistId);

  await playlist.save();

  return res
    .status(200)
    .json(new ApiResponse(201, playlist, "Playlist deleted succesfull"));
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;
  //TODO: update playlist

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(404, "Invalid token ID");
  }

  if (!name || !description) {
    throw new ApiError(400, "Name and description are required");
  } 

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(404, "User playlist not found");
  }


  if (playlist.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(403, "Only owner can update playlist");
  }   


  playlist.name = name;
  playlist.description = description;
  await playlist.save();

  return res
    .status(200)
    .json(new ApiResponse(201, playlist, "Playlist updated successfully"));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  //TODO: get user playlists

  if (!isValidObjectId(userId)) {
    throw new ApiError(404, "Invalid token ID");
  }

  const userPlaylist = await Playlist.find({ owner: userId }).populate(
    "playlist"
  );

  if (!userPlaylist) {
    throw new ApiError(404, "User playlist not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(201, userPlaylist, "User playlist found"));
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
