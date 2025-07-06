import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import { ApiError } from "../utils/APiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const {content}=req.body;
    if (!content || content.trim() === "") {
        throw new ApiError(400, "Content is required");
    }

    if (!req.user?._id) {
        throw new ApiError(401, "Unauthorized: User not found");
    }

   const newTweet= await Tweet.create({
        content,
        owner: req.user?._id
   })

   const tweet= await Tweet.findById(newTweet._id);

     if (!tweet) {
        throw new ApiError(500, "Something went wrong while saving the Tweet");
    }

    return res.status(201).json(
        new ApiResponse(201, tweet, "Tweet registered successfully.")
    );
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const userId = req.user._id;

    if(!userId) throw new ApiError(400,"User is not available");

    const tweets = await Tweet.find({owner:userId}).sort({createdAt:-1})
    
        return res.status(200).json(
        new ApiResponse(200, tweets, "Fetched user's tweets successfully.")
    )
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const {tweetId} = req.params;
    const {content} =req.body
     if (!content || content.trim() === "") {
        throw new ApiError(400, "Content is required");
    }
    const tweet = await Tweet.findByIdAndUpdate(
            tweetId,
            {
                $set: { content: content.trim() } 
            },
            { new: true }
        );
         if (!tweet) {
        throw new ApiError(404, "Tweet not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, tweet, "Tweet details updated successfully"));
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const { tweetId } = req.params
        if(!isValidObjectId(tweetId)) throw new ApiError(400,"Invalid Tweet request");
    
         const tweet = await Tweet.findById(tweetId)
        if(!tweet) throw new ApiError(404,"Tweet FIle is missing");
    
        await tweet.deleteOne();
          return res.status(200).json(new ApiResponse(200,null,"Tweet deleted Succesfully"));
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}