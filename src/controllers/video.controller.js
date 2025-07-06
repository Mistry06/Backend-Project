import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/videos.model.js"
import {User} from "../models/user.model.js"
import { ApiError } from "../utils/APiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
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

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;

    if ([title, description].some(field => !field || field.trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }

    const videoLocalPath = req.files?.video?.[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

    if (!videoLocalPath) {
        throw new ApiError(400, "Video file is required");
    }

    const video = await uploadOnCloudinary(videoLocalPath, "video", "videos-folder");
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath, "image", "thumbnails-folder");

    if (!video) {
        throw new ApiError(400, "Video upload failed");
    }

    const newVideo = await Video.create({
        videoFile: video.url,
        thumbnail: thumbnail.url,
        title,
        description,
        owner: req.user?._id,
    });

    const createdVideo = await Video.findById(newVideo._id);

    if (!createdVideo) {
        throw new ApiError(500, "Something went wrong while saving the video");
    }

    return res.status(201).json(
        new ApiResponse(201, createdVideo, "Video registered successfully.")
    );
});


const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    if(!isValidObjectId(videoId)) throw new ApiError(400,"Video is not avialabel");
    const video =  await Video.findByIdAndUpdate(videoId,
        {$inc:{views:1}},
        {new:true}//store new updated value
    ).populate("owner", "username fullname avatar")

    if(!video) throw new ApiError(404,"Video Not Found");

     return res.status(200).json(
        new ApiResponse(200, video, "Video Found successfully.")
    );

})

//Read This After
const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description } = req.body;
  const thumbnailFile = req.file;

  if (!title || !description || !thumbnailFile) {
    throw new ApiError(400, "All fields are required");
  }

  // Optionally: upload to Cloudinary
  const uploadedThumbnail = await uploadOnCloudinary(
    thumbnailFile.path,
    "image",
    "thumbnails-folder"
  );

  const video = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        title,
        description,
        thumbnail: uploadedThumbnail.url // 👈 save Cloudinary URL
      }
    },
    { new: true }
  );

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video details updated successfully"));
});



const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    if(!isValidObjectId(videoId)) throw new ApiError(400,"Invalid Video request");

     const video = await Video.findById(videoId)
    if(!video) throw new ApiError(400,"Video FIle is missing");

    await video.deleteOne();
      return res.status(200).json(new ApiResponse(200,null,"Video deleted Succesfully"));
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if(!isValidObjectId(videoId)) throw new ApiError(400,"video is not availabele");
     const video=await Video.findById(videoId);
     if(!video) throw new ApiError(400,"Video is missing");
     video.isPublished=!video.isPublished;
     await video.save();
     return res.status(200).json(new ApiResponse(200,video,`Video is now ${video.isPublished ? "Published":"Unpublished"}`));
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}