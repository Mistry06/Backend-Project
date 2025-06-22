import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/APiError.js"
import { User } from "../models/user.model.js";
import {uploadOnCloudinary} from '../utils/cloudinary.js'
import { ApiResponse } from "../utils/ApiResponse.js";



// Add this line
console.log('user.controller.js: Module loaded.');

const userRegister = asyncHandler(async(req, res)=>{
   

   //taking all the information
const {fullname,email,password,username}=req.body;

//to check fields are empty or not 
if([].some((field)=>field?.trim()==="")
){
    throw new ApiError(400,"All fields are required");
}

//to check a user is alredy exits or not 
const existedUser = User.findone({
    $or:[{username},{email}]
})
if(existedUser){
    throw new ApiError(409,"User with email or username already exits");
}

//to check Images 
const avatarLocalPath = req.files?.avatar[0]?.path;
const coverImageLocalPath=req.files?.coverImage[0]?.path;
if(!avatarLocalPath){
    throw new ApiError(400,"Avatar file is required");
}

// Upload them iinto cloudinary
const avatar  =  await uploadOnCloudinary(avatarLocalPath);
const coverImage = await uploadOnCloudinary(coverImageLocalPath);
if(!avatar){
    throw new ApiError(400,"Avatar file is required");
}

//create user object
const newUser=await User.create({
    fullname,
    avatar:avatar.url,
    coverImage:coverImage.url,
    email,
    password,
    username:username.tolowercase()
})

// check user is create or not 
const createdUser = await User.findById(User.id).select("-password -refreshToken")
if(!createdUser){
    throw new ApiError(500,"somethinng went wrong while registering user");
}

//A successfull Response
return res.status(201).json(
    new ApiResponse(200,createdUser,"User registered successfully .")
)





});

export {userRegister};
// Add this line
console.log('user.controller.js: userRegister function EXPORTED.');

