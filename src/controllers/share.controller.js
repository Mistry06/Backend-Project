
import { Share } from "../models/share.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// @desc    Share a video
// @route   POST /api/share/:videoId
// @access  Private
export const shareVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { platform = "other", message = "" } = req.body;
  const userId = req.user?._id;

  const share = await Share.create({
    user: userId,
    video: videoId,
    platform,
    message,
    sharedAt: new Date()
  });

  res
    .status(201)
    .json(new ApiResponse(201, share, "Share recorded successfully"));
});
