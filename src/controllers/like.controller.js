import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/APiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const userId = req.user?._id;
  if (!userId) {
    throw new ApiError(401, "Unauthorized");
  }

  const existing = await Like.findOne({ video: videoId, likedBy: userId });

  if (existing) {
    await existing.deleteOne();
    return res.status(200).json(new ApiResponse(200, videoId, "Unliked successfully"));
  } else {
    const like = new Like({ video: videoId, likedBy: userId });
    await like.save();
    return res.status(200).json(new ApiResponse(200, videoId, "Liked successfully"));
  }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid comment ID");
  }

  const userId = req.user?._id;
  if (!userId) {
    throw new ApiError(401, "Unauthorized");
  }

  const existing = await Like.findOne({ comment: commentId, likedBy: userId });

  if (existing) {
    await existing.deleteOne();
    return res.status(200).json(new ApiResponse(200, commentId, "Unliked successfully"));
  } else {
    const like = new Like({ comment: commentId, likedBy: userId });
    await like.save();
    return res.status(200).json(new ApiResponse(200, commentId, "Liked successfully"));
  }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweet ID");
  }

  const userId = req.user?._id;
  if (!userId) {
    throw new ApiError(401, "Unauthorized");
  }

  const existing = await Like.findOne({ tweet: tweetId, likedBy: userId });

  if (existing) {
    await existing.deleteOne();
    return res.status(200).json(new ApiResponse(200, tweetId, "Unliked successfully"));
  } else {
    const like = new Like({ tweet: tweetId, likedBy: userId });
    await like.save();
    return res.status(200).json(new ApiResponse(200, tweetId, "Liked successfully"));
  }
});

const getLikedVideos = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError(400, "User is not available");
  }

  const likedVideos = await Like.find({
    video: { $ne: null },
    likedBy: userId
  })
    .populate({
      path: "video",
      match: { isPublished: true }
    })
    .sort({ createdAt: -1 });

  const videos = likedVideos
    .map(like => like.video)
    .filter(video => video !== null);

  return res.status(200).json(
    new ApiResponse(200, videos, "Fetched user's liked videos successfully.")
  );
});

export {
  toggleCommentLike,
  toggleTweetLike,
  toggleVideoLike,
  getLikedVideos
};
