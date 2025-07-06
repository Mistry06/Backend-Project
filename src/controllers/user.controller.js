import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/APiError.js"
import { User } from "../models/user.model.js";
import {uploadOnCloudinary} from '../utils/cloudinary.js'
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
import mongoose, { mongo } from "mongoose";

// Add this line
console.log('user.controller.js: Module loaded.');

const userRegister = asyncHandler(async(req, res)=>{

    console.log('userRegister: Function entered.'); // Debug log
    console.log('userRegister: req.body:', req.body); // Debug log: Check received text fields

    // --- IMPORTANT DEBUG LOGS FOR FILES ---
    console.log('userRegister: req.files:', req.files); // Debug log: Check what Multer provides
    console.log('userRegister: req.files?.avatar:', req.files?.avatar); // Debug log: Specific check for avatar array
    console.log('userRegister: req.files?.avatar[0]:', req.files?.avatar?.[0]); // Debug log: Check first element of avatar array
    console.log('userRegister: req.files?.avatar[0]?.path:', req.files?.avatar?.[0]?.path); // Debug log: Check the path

    //taking all the information
    const {fullname,email,password,username}=req.body;

    //to check fields are empty or not
    // This condition `[].some(...)` will always be false.
    // It should typically be an array of the required fields, like:
    // const requiredFields = [fullname, email, password, username];
    // if(requiredFields.some((field) => field?.trim() === "" || field === undefined || field === null)) {
    //     throw new ApiError(400,"All fields are required");
    // }
    // For now, let's keep your original line, but be aware of this.
    if([].some((field)=>field?.trim()==="")
    ){
        throw new ApiError(400,"All fields are required");
    }

    //to check a user is alredy exits or not
    const existedUser = await User.findOne({
        $or:[{username},{email}]
    })
    if(existedUser){
        throw new ApiError(409,"User with email or username already exits");
    }

    //to check Images
    const avatarLocalPath = req.files?.avatar[0]?.path;
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage)&& req.files.coverImage.length>0){
        coverImageLocalPath=req.files.coverImage[0].path;
    }

    console.log('userRegister: Calculated avatarLocalPath:', avatarLocalPath); // Debug log
    console.log('userRegister: Calculated coverImageLocalPath:', coverImageLocalPath); // Debug log

    if(!avatarLocalPath){
        console.error('userRegister: Avatar file path is missing before Cloudinary upload.'); // Error log
        throw new ApiError(400,"Avatar file is required");
    }

    // Upload them iinto cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    console.log('userRegister: Cloudinary avatar response:', avatar); // Debug log
    console.log('userRegister: Cloudinary coverImage response:', coverImage); // Debug log

    if(!avatar){
        console.error('userRegister: Avatar upload to Cloudinary failed or returned null.'); // Error log
        throw new ApiError(400,"Avatar file is required"); // Consider a more specific message here
    }

    //create user object
    const newUser=await User.create({
        fullname,
        avatar:avatar.url,
        coverImage: coverImage ? coverImage.url : undefined, // Handle optional cover image
        email,
        password,
        username:username.toLowerCase()
    })

    // check user is create or not
    const createdUser = await User.findById(newUser._id).select("-password -refreshToken")
    if(!createdUser){
        console.error('userRegister: User not found after creation.'); // Error log
        throw new ApiError(500,"somethinng went wrong while registering user");
    }

    //A successfull Response
    return res.status(201).json(
        new ApiResponse(200,createdUser,"User registered successfully .")
    )
});
//use of access and refresh token
    const generateAccessAndRefreshToken = async(userId)=>{
        try {
            const user = await User.findById(userId);
            const accessToken =user.generateAccessToken();
            const refreshToken=user.generateRefreshToken();
            user.refreshToken=refreshToken
            await user.save({validateBeforeSave:false});
            return{accessToken,refreshToken}
        } catch (error) {
            throw new ApiError(500,"Something went wrong");
        }
    }
//login user
const loginUser = asyncHandler(async(req,res)=>{
    const {username,email,password}=req.body;
    //by this user can login uyseing username or password
    if(!(username ||email)){
        throw new ApiError(400,"username or email is required");
    }
    const user = await User.findOne({
        $or:[{username},{email}]
    })
    if(!user){
        throw new ApiError(400,"User does not Exits");
    }
    //checking the password
    const ispasswordValid = await user.isPasswordCorrect(password);
    if(!ispasswordValid) throw new  ApiError(401,"Invalid user Credintials");

const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);
//loginuser

    const userForResponse = user.toObject(); // Convert Mongoose document to plain JavaScript object
    console.log("userForResponse = ",userForResponse)
    delete userForResponse.password;        // Remove password
    delete userForResponse.refreshToken;    // Remove refresh token
     console.log("userForResponse = ",userForResponse)
//cookies
const options = {
    httpOnly:true,
    secure:true
}
return res
.status(200)
.cookie("accessToken",accessToken,options)
.cookie("refreshToken",refreshToken,options)
.json(
    new ApiResponse(
        200,
        {
            user:userForResponse,accessToken,refreshToken
        },
        "User Logged In Successfully"
    )
)
})
//logout User   ,    
const logoutUser = asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(
        req.user.id,{
            $set:{
                refreshToken:undefined
            }
        },{
            new:true
        }
    )
    const options = {
        httpOnly:true,
        secure:true
    }
    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(
    200,             // statusCode
    {},              // data
    "User Logged In Successfully", // message
    "User Logged Out" // <--- This was the 'errors' argument
));
})
//refresh access token 
const refreshAccessToken = asyncHandler(async(req,res)=>{
    const incomingRefreshToken=req.cookies.refreshToken || req.body.refreshToken;
    if(!incomingRefreshToken){
        throw new ApiError(401,"Unauthorize Request");
    }
    const decodedToken = jwt.verify(
        incomingRefreshToken,
        process.env.REFRESH_TOKEN_SECRET
    )
    const user = await User.findById(decodedToken?._id)
    if(!user){
        throw new ApiError(401,"Invalid refresh Token");
    }
    if(incomingRefreshToken !==user?.refreshToken){
        throw new ApiError(401,"Refresh Token is Expired or used");
    }
    const options={
        httpOnly:true,
        secure:true
    }
    const {accessToken,newRefreshToken}=await generateAccessAndRefreshToken(user._id);
    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",newRefreshToken,options)
    .json(new ApiResponse(200,{accessToken,newRefreshToken}),"Access Token Refreshed");
 
})
//change Password
const changePassword = asyncHandler(async(req,res)=>{
    const {oldPassword,newPassword}=req.body;
    const user = await User.findById(req.user?._id);
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
    if(!isPasswordCorrect) throw new ApiError(400,"Invalid Old Password");
    if(oldPassword==newPassword) throw new ApiError(400,"The old and new Password are same");
    user.password=newPassword
    await user.save({validateBeforeSave:false})
    return res.status(200).json(new ApiResponse(200,({}),"Password Changed"));
})
//current User
const getCurrentUser= asyncHandler(async(req,res)=>{
    return res.status(200).json(new ApiResponse(200,req.user,"Current User Fetched Succesfully"));
})
//Update User Deatails
const updateAccountDetails = asyncHandler(async(req,res)=>{
    const{fullname,email}=req.body
    if(!fullname || !email)
        throw new ApiError(400,"All Fields are required")

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullname,
                email:email
            }
        },{new:true}
    ).select("-password");
      return res.status(200).json(new ApiResponse(200,user,"Account details Updated Succesfully"));
})
//Update Files
const updateUserAvatar = asyncHandler(async(req,res)=>{
    const avatarLocalPath = req?.file?.path;
    if(!avatarLocalPath)
        throw new ApiError(400,"Avatar File is missing")

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    if(!avatar.url)
        throw new ApiError(400,"Error while uploadfing on avatar");
    const user = await User.findByIdAndUpdate(
        req.user?._id,{
            $set:{
                avatar:avatar.url
            }
        },{new:true}
    ).select("-password")
      return res.status(200).json(new ApiResponse(200,user,"Avatar Image Updated Succesfully"));
})
const updateUserCoverImage = asyncHandler(async(req,res)=>{
    const coverImageLocalPath = req?.file?.path;
    if(!coverImageLocalPath)
        throw new ApiError(400,"Cover Image File is missing")

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if(!coverImage.url)
        throw new ApiError(400,"Error while uploadfing on Cover Image");
    const user = await User.findByIdsAndUpdate(
        req.user?._id,{
            $set:{
                coverImage:coverImage.url
            }
        },{new:true}
    ).select("-password")
      return res.status(200).json(new ApiResponse(200,user,"Cover Image Updated Succesfully"));
})
//aggregation
const getUserChannelProfile = async (req, res) => {
    try {
        const { username } = req.params; // Get username from URL parameters
        const loggedInUserId = req.user?._id; // Get logged-in user's ID (assuming authentication populates req.user)

        if (!username) {
            throw new ApiError(400, "Username is required");
        }

        const channel = await User.aggregate([
            {
                $match: {
                    username: username?.toLowerCase()
                }
            },
            {
                // Lookup subscribers for the current channel (user)
                $lookup: {
                    from: "subscriptions", // **Ensure this matches your actual MongoDB collection name**
                    localField: "_id",
                    foreignField: "channel", // 'channel' field in Subscription refers to the User's _id (the channel)
                    as: "subscribers"
                }
            },
            {
                // Lookup channels the current user (this channel) is subscribed to
                $lookup: {
                    from: "subscriptions", // **Ensure this matches your actual MongoDB collection name**
                    localField: "_id",
                    foreignField: "subscriber", // 'subscriber' field in Subscription refers to the User's _id
                    as: "subscribedTo"
                }
            },
            {
                $addFields: {
                    subscribersCount: {
                        $size: "$subscribers"
                    },
                    channelsSubscribedToCount: {
                        $size: "$subscribedTo"
                    },
                    isSubscribed: {
                        $cond: {
                            if: {
                                $in: [loggedInUserId, "$subscribers.subscriber"]
                            },
                            then: true,
                            else: false
                        }
                    }
                }
            },
            {
                 $project: {
                    fullname: 1,
                    username: 1,
                    subscribersCount: 1,
                    channelsSubscribedToCount: 1,
                    isSubscribed: 1,
                    avatar: 1,
                    coverImage: 1,
                    email: 1,
                    createdAt: 1,
                    updatedAt: 1
                }
            }
        ]);

        if (!channel?.length) {
            throw new ApiError(404, "Channel does not exist");
        }

        // Return a successful response
        return res
            .status(200)
            .json(new ApiResponse(200, channel[0], "User channel fetched successfully"));

    } catch (error) {
        // Centralized error handling. Assuming ApiError has a statusCode property.
        console.error("Error fetching user channel profile:", error);
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Internal Server Error"
        });
    }
};
// watch History
const getWatchHistory = asyncHandler(async (req, res) => {
    // Ensure req.user and req.user._id exist from your authentication middleware
    if (!req.user || !req.user._id) {
        throw new ApiError(401, "User not authenticated or ID missing");
    }

    const userId = new mongoose.Types.ObjectId(req.user._id);

    const watchHistory = await User.aggregate([
        {
            $match: { _id: userId }
        },
        {
            $lookup: {
                from: "videos", // Collection name for videos
                localField: "watchHistory", // Field in the User document (array of video _ids)
                foreignField: "_id",        // Matching _id field in the videos collection
                as: "watchHistory",         // Name of the new array field to add
                pipeline: [
                    {
                        $lookup: {
                            from: "users", // Collection name for users (for video owner)
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner", // This will be an array
                            pipeline: [
                                {
                                    $project: {
                                        _id: 1, // Include _id if you need it
                                        fullName: 1, // Assuming 'fullName' or 'fullname'
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        // Deconstruct the 'owner' array to get the single owner object
                        $addFields: {
                            owner: {
                                $first: "$owner" // Get the first element from the 'owner' array
                            }
                        }
                    },
                    {
                        // Project specific fields from the video itself
                        $project: {
                            _id: 1,
                            videoFile: 1,
                            thumbnail: 1,
                            title: 1,
                            description: 1,
                            duration: 1,
                            views: 1,
                            isPublished: 1,
                            createdAt: 1,
                            owner: 1, // Include the deconstructed owner object
                            // You might want to exclude the temporary owner array from the lookup result
                            // if you don't need it explicitly after $addFields
                            // owner: 0 // if you don't want the raw array as well
                        }
                    }
                ]
            }
        },
        {
            // Since $match only returns one user, and we only need their watchHistory
            // we can directly project the watchHistory array from the first document.
            $project: {
                watchHistory: 1
            }
        }
    ]);

    // Check if watchHistory was found for the user
    // The result of the aggregation will be an array containing one user object
    // with the populated watchHistory, or an empty array if the user is not found.
    if (!watchHistory || watchHistory.length === 0 || !watchHistory[0].watchHistory) {
        return res
            .status(200)
            .json(new ApiResponse(200, [], "Watch history is empty or user not found"));
    }

    // Return the watchHistory array from the first (and only) document
    return res
        .status(200)
        .json(new ApiResponse(200, watchHistory[0].watchHistory, "Watch history fetched successfully"));
});
export { getUserChannelProfile }; // Export the function for use in your routes
export {userRegister,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changePassword,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getCurrentUser,
    getWatchHistory};
// Add this line
console.log('user.controller.js: userRegister function EXPORTED.');