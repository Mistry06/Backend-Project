import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/APiError.js"
import { User } from "../models/user.model.js";
import {uploadOnCloudinary} from '../utils/cloudinary.js'
import { ApiResponse } from "../utils/ApiResponse.js";

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
//login user
const loginUser = asyncHandler(async(req,res)=>{
    const {email,username,password}=req.body;
    //by this user can login uyseing username or password
    if(!username ||email){
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
  
  //use of access and refresh token
    const generateAccessAndRefreshToken = async(UserId)=>{
        try {
            const user = await User.findById(UserId);
            const accessToken =User.generateAccessToken();
            const refreshToken=User.generateRefreshToken();
            user.refreshToken=refreshToken
            await user.Save({validateBeforesave:false});
            return{accessToken,refreshToken}
        } catch (error) {
            throw new ApiError(500,"Something went wrong");
        }
    }

//loginuser
async function loggedInUser(authenticatedUserId) { // Encapsulating the login logic in a function
    try {
        const { accessToken, refreshToken } = await generateAccessAndRefreshToken(authenticatedUserId);

        const loggedInUser = await User.findById(authenticatedUserId).select("-password -refreshToken"); // Corrected select syntax

        if (!loggedInUser) {
            throw new ApiError(404, "Logged-in user not found after token generation");
        }

        // Now you can send these tokens and user data in the response
        return { accessToken, refreshToken, loggedInUser };

    } catch (error) {
        console.error("Login error:", error);
        throw error; // Re-throw the specific error for upstream handling
    }
}
//cookies
const options = {
    httpOnly:true,
    secure:true
}
return res
.status(200)
.cookie("accessToken",accessToken,options)
.cookie("refreshToken",refreshToken,options)
.josn(
    new ApiResponse(
        200,
        {
            user:loggedInUser,accessToken,refreshToken
        },
        "User Logged In Successfully"
    )
)
})
//logout User
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
    .clearcookie("accessToken",options)
    .clearcookie("refreshToken",options)
    .json(new ApiError(200,{},"User Logged Out"));
})
export {userRegister,loginUser,logoutUser};
// Add this line
console.log('user.controller.js: userRegister function EXPORTED.');