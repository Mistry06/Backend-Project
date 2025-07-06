import {mongoose,isValidObjectId} from "mongoose"
import { Video } from "../models/videos.model.js"
import {Comment} from "../models/commnet.model.js"
import { ApiError } from "../utils/APiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params

    const {page = 1, limit = 10, sortBy = "createdAt",sortType = "desc"} = req.query

     if(!videoId) throw new ApiError(400,"Video is not available");

      // Build sort option
    const sortOption = {};
    sortOption[sortBy] = sortType === "asc" ? 1 : -1;

      // Filter by video ID
    const filter = { video: videoId };

     // Get total count for pagination
    const total = await Comment.countDocuments(filter);

     // Get videos from database
    const comments = await Comment.find(filter)
        .populate("owner","name avatar")
        .sort(sortOption)
        .skip((page - 1) * limit)
        .limit(Number(limit));
      // Return response
    return res.status(200).json(
        new ApiResponse(200, {
            comments,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / limit)
            }
        }, "Comments fetched successfully")
    );

})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {content}=req.body;
    const {videoId} = req.params
      if (!content || content.trim() === "") {
        throw new ApiError(400, "Content is required");
    }
     if (!req.user?._id) {
        throw new ApiError(401, "Unauthorized: User not found");
    }
    const videoExists = await Video.findById(videoId);
    if (!videoExists) {
        throw new ApiError(404, "Video not found");
    }
       const newComment= await Comment.create({
        content,
         video:videoId,
        owner: req.user?._id
   })
    const Com= await Comment.findById(newComment._id)
     if (!Com) {
        throw new ApiError(500, "Something went wrong while saving the Comment");
    }

    return res.status(201).json(
        new ApiResponse(201, Com, "Comment registered successfully.")
    );
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
     const {commentId} = req.params;
        const {content} =req.body
         if (!content || content.trim() === "") {
            throw new ApiError(400, "Content is required");
        }
        const comment = await Comment.findById(commentId);

        if (!comment) {
        throw new ApiError(404, "Comment not found");
    }
      if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Forbidden: You can't edit this comment");
    }
         comment.content = content.trim();
    await comment.save();

        return res
            .status(200)
            .json(new ApiResponse(200, comment, "Comment details updated successfully"));
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const { commentId } = req.params
            if(!isValidObjectId(commentId)) throw new ApiError(400,"Invalid comment request");
        
             const comment = await Comment.findById(commentId)
            if(!comment) throw new ApiError(404,"Comment FIle is missing");
        
            await comment.deleteOne();
              return res.status(200).json(new ApiResponse(200,null,"Comment deleted Succesfully"));
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }