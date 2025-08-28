import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js ";
import path from "path";
import jwt from "jsonwebtoken";
import { Subscription } from "../models/subscription.model.js";
import mongoose from "mongoose";

const generateAccessTokenAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, "User not found");
    }
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      error?.message ||
        "Something went wrong while generating refresh and access token"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  // get user details from frontend
  // validation - not empty
  // check if user already exists: userName, email
  // check for images, check for avatar
  // upload them to cloudinary, avatar
  // create user object - create entry in db
  // remove password and refresh token field from response
  // check for user creation
  // return res

  if (!req.body) {
    throw new ApiError(400, "Request body is missing");
  }

  const { fullName, email, userName, password } = req.body;

  if (
    [fullName, email, userName, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = await User.findOne({
    $or: [{ email }, { userName }],
  });

  if (existedUser) {
    throw new ApiError(404, "User with email or userName already exists");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path
    ? path.resolve(req.files.avatar[0].path)
    : undefined;
  const coverImageLocalPath = req.files?.coverImage[0]?.path
    ? path.resolve(req.files.coverImage[0].path)
    : undefined;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar image is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  const user = await User.create({
    fullName,
    email,
    userName: userName.toLowerCase(),
    avatar: avatar?.url,
    coverImage: coverImage?.url || "",
    password,
  });

  const createdUser = await User.findOne(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "User registration failed");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  // req.body--> data
  // get user credentials from frontend
  // validation - not empty
  // check if user exists: email
  // compare password
  // generate access and refresh tokens
  // return tokens and user info

  const { email, userName, password } = req.body;

  if (!email && !userName) {
    throw new ApiError(400, "username or email fields are required");
  }
  if (!password || typeof password !== "string" || password.trim() === "") {
    throw new ApiError(400, "password field is required");
  }

  const user = await User.findOne({
    $or: [{ email }, { userName }],
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  console.log(user);
  const isPasswordValid = await user.isPasswordCorrect(password);

  console.log(isPasswordValid);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid credentials password");
  }

  const { accessToken, refreshToken } =
    await generateAccessTokenAndRefreshToken(user._id);

  const loggedInUser = await User.findOne(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "Strict",
  };

  return res
    .status(200)
    .cookie("refreshToken", refreshToken, options)
    .cookie("accessToken", accessToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  //req.body
  User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "Strict",
  };

  res
    .status(200)
    .clearCookie("refreshToken", options)
    .clearCookie("accessToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  try {
    const incomingRefreshToken =
      req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
      throw new ApiError(401, "unauthorized request");
    }

    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid Token Access");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    const { accessToken, refreshToken } =
      await generateAccessTokenAndRefreshToken(user._id);

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          201,
          { accessToken, refreshToken },
          "Access Token Refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid Token Access");
  }
});

const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select(
    "-password -refreshToken"
  );

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Current user fetched successfully"));
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    throw new ApiError(400, "Old and new password are required");
  }

  const user = await User.findById(req.user?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(401, "Old password is incorrect");
  }

  if (oldPassword === newPassword) {
    throw new ApiError(409, "New password cannot be the same as old password");
  }

  user.password = newPassword;
  console.log("New password:", newPassword);

  await user.save({ validateBeforeSave: true });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;

  if (!fullName && !email) {
    throw new ApiError(400, "Atleast one field is required");
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        fullName: fullName || req.user.fullName,
        email: email || req.user.email,
      },
    },
    {
      new: true,
    }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  console.log(req.file);
  const avatarLocalPath = req.file?.path
    ? path.resolve(req.file.path)
    : undefined;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar image is missing");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar?.url) {
    throw new ApiError(500, "Avatar upload failed, please try again later");
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        avatar: avatar?.url,
      },
    },
    {
      new: true,
    }
  ).select("-password -refreshToken");

  const avatarImage = user.avatar;

  return res
    .status(200)
    .json(
      new ApiResponse(200, { avatarImage }, "User avatar updated successfully")
    );
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;

  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover image is missing");
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!coverImage?.url) {
    throw new ApiError(
      500,
      "Cover image upload failed, please try again later"
    );
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        coverImage: coverImage?.url,
      },
    },
    {
      new: true,
    }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { coverImage: user.coverImage },
        "User cover image updated successfully"
      )
    );
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  try {
    console.log(req.params);
    const { username } = req.params;

    if (!username?.trim()) {
      throw new ApiError(400, "Username is required");
    }

    const channel = await User.aggregate([
      {
        $match: {
          userName: username.toLowerCase(),
        },
      },
      {
        $lookup: {
          from: "subscriptions",
          localField: "_id",
          foreignField: "channel",
          as: "subscribers",
        },
      },
      {
        $lookup: {
          from: "subscriptions",
          localField: "_id",
          foreignField: "subscriber",
          as: "subscribedTo",
        },
      },

      {
        $addFields: {
          subscribersCount: {
            $size: "$subscribers",
          },
          channelSubscribedToCount: {
            $size: "$subscribedTo",
          },

          isSubscribedTo: {
            $cond: {
              if: { $in: [req.user._id, "$subscribers.subscriber"] },
              then: true,
              else: false,
            },
          },
        },
      },

      {
        $project: {
          fullName: 1,
          userName: 1,
          subscribersCount: 1,
          channelSubscribedToCount: 1,
          email: 1,
          avatar: 1,
          coverImage: 1,
        },
      },
    ]);

    console.log(channel);

    if (!channel?.length) {
      throw new ApiError(404, "Channel not found");
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, channel[0], "Channel profile fetched successfully")
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid access token");
  }
});

const getUserWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id),
      },
    },

    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    userName: 1,
                    avatar: 1,
                    coverImage: 1,
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
            },
          },
        ],
      },
    },
  ]);

  console.log(user);

  return res
    .status(200)
    .json(
      new ApiResponse(
        201,
        { watchHistory: user[0].watchHistory },
        "user watched history fetched successfully"
      )
    );
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  getCurrentUser,
  updateAccountDetails,
  changeCurrentPassword,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getUserWatchHistory,
};
