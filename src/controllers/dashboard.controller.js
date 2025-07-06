import mongoose from "mongoose"
import {Video} from "../models/videos.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import { ApiError } from "../utils/APiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
  const { user } = req.body;

  if (!user) {
    throw new ApiError(400, "User ID is required");
  }

// //Read after ✅ What It Does:
// This function calculates the total number of views for all videos owned by a specific user.

// 📘 Explanation:
// await Video.aggregate([...])
// This uses MongoDB’s aggregation pipeline, which lets you process and transform data inside the database (faster and memory-efficient).

// Step 1: $match

// { $match: { owner: userId } }
// This filters the Video collection to include only the videos that belong to the given user (by their userId).

// Example:
// If userId = "123", this matches:

// { owner: "123" }
// Step 2: $group

// { $group: { _id: null, totalViews: { $sum: "$views" } } }
// This takes all the matched videos and:

// Groups them together (_id: null means all in one group)

// Calculates the sum of their views field

// Stores it in totalViews

// Result might look like:

// [{ _id: null, totalViews: 8570 }]
// Final Line:

// return result[0]?.totalViews || 0;
// This:

// Returns totalViews from the first result if it exists

// If no videos are found, returns 0 as default

// 🧠 Example:
// If the user has 3 videos with these views:

// Video 1 → 1000 views

// Video 2 → 2000 views

// Video 3 → 3000 views

// Then the function returns: 6000

const getTotalViews = async (userId) => {
  const result = await Video.aggregate([
    { $match: { owner: userId } },
    { $group: { _id: null, totalViews: { $sum: "$views" } } }
  ]);

  return result[0]?.totalViews || 0;
};


  const [totalVideos, totalLikes,totalViews, totalSubscribers] = await Promise.all([
    Video.countDocuments({ owner: user }),
    Like.countDocuments({owner:user}),
    getTotalViews(user),
    Subscription.countDocuments({ channel: user })
  ]);

  return res.status(200).json(
    new ApiResponse(200, {
      totalVideos,
      totalLikes,
      totalViews,
      totalSubscribers
    }, "Channel stats fetched successfully")
  );
});


const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
    // Build filter for search and user
    const filter = {
        isPublished: true
    };
       // Search by title or description (case insensitive)
    if (query) {
        filter.$or = [
            { title: { $regex: query, $options: "i" } },
            { description: { $regex: query, $options: "i" } }
        ];
    }
     // Filter by userId if provided
    if (userId) {
        filter.owner = userId;
    }
    // Build sort option
    const sortOption = {};
    sortOption[sortBy] = sortType === "asc" ? 1 : -1;
     // Get total count for pagination
    const total = await Video.countDocuments(filter);

    // Get videos from database
    const videos = await Video.find(filter)
        .populate("owner", "username fullname avatar")
        .sort(sortOption)
        .skip((page - 1) * limit)
        .limit(Number(limit));

    // Return response
    return res.status(200).json(
        new ApiResponse(200, {
            videos,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / limit)
            }
        }, "Videos fetched successfully")
    );
})

export {
    getChannelStats, 
    getChannelVideos
    }