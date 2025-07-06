import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import { ApiError } from "../utils/APiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    const  subscriberId  = req.user._id
    // TODO: toggle subscription
    if(!isValidObjectId(channelId) || !isValidObjectId(subscriberId)) throw new ApiError (400,"Invalid channel Or Invalid User");
    const existing=await Subscription.findOne({
        subscriber:subscriberId,
         channel:channelId
    })
    if(existing){
        await existing.deleteOne()
         return res
            .status(200)
            .json(new ApiResponse(200, channelId, "Unsubscribed successfully"));
    }
    else{
        const sub=new Subscription({subscriber:subscriberId,channel:channelId}) 
        await sub.save();
        return res
            .status(200)
            .json(new ApiResponse(200, channelId, "Subscribed successfully"));
    }
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params ;
    if(!isValidObjectId(channelId)) throw new ApiError (400,"Invalid channel");
    const count = await Subscription.countDocuments(
        {
            channel:channelId
        })
    return res
    .status(200)
    .json(new ApiResponse(200, { channelId, Subscribers :count}, "Subscriber count fetched"));
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const  subscriberId  = req.user._id
     if(!isValidObjectId(subscriberId)) throw new ApiError (400,"Invalid Subscriber");
    const count = await Subscription.countDocuments(
        {
             subscriber:subscriberId
        })
    return res
    .status(200)
    .json(new ApiResponse(200, { subscriberId, Subscribed :count}, "Subscribed channel count fetched"));

})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}