import mongoose, {isValidObjectId} from "mongoose"
import { Video } from "../models/videos.model.js"
import {Playlist} from "../models/playlist.model.js"
import { ApiError } from "../utils/APiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body;
    const { video: videoId } = req.body;

    // Check for required fields
    if (!name || !description) {
        throw new ApiError(400, "All fields are required");
    }

    // Check if user is authenticated
    if (!req.user || !req.user._id) {
        throw new ApiError(401, "Unauthorized: User not found");
    }

    // Check if the video exists
    const videoExists = await Video.findById(videoId);
    if (!videoExists) {
        throw new ApiError(404, "Video not found");
    }

    // Create playlist
    const newPlaylist = await Playlist.create({
        name,
        description,
        video: [videoId], // stored as an array if multiple videos will be allowed later
        owner: req.user._id
    });

    // Fetch complete playlist (optional: populate fields if needed)
    const playlist = await Playlist.findById(newPlaylist._id);
    if (!playlist) {
        throw new ApiError(500, "Something went wrong while saving the playlist");
    }

    return res.status(201).json(
        new ApiResponse(201, playlist, "Playlist created successfully.")
    );
});


const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists
        if(!isValidObjectId(userId)) throw new ApiError(400,"User is not available");
    
        const skip = (page - 1) * limit;

    let query = Playlist.find({ owner: userId })
        .sort({ createdAt: -1 })
        .skip(Number(skip))
        .limit(Number(limit));

    // Conditionally populate videos and owner
    if (populate === "true") {
        query = query.populate("video").populate("owner", "username");
    }

    const playlists = await query;
        
            return res.status(200).json(
            new ApiResponse(200, playlist, "Fetched user's Playlist successfully.")
        )
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id
    if(!isValidObjectId(playlistId)) throw new ApiError(400,"playlist is not avialabel");
    const playlist =  await Playlist.findByIdAndUpdate(playlistId,
        {$inc:{views:1}},
        {new:true}//store new updated value
    ).populate("owner", "username fullname avatar")

    if(!playlist) throw new ApiError(404,"Playlist Not Found");

     return res.status(200).json(
        new ApiResponse(200,playlist, "Playlist Found successfully.")
    );

})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    // Validate IDs
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid Playlist ID");
    }
     if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Video ID");
    }

    // Check playlist existence
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

      // Check if the requester owns the playlist
    if (String(playlist.owner) !== String(req.user._id)) {
        throw new ApiError(403, "You do not have permission to modify this playlist");
    }

    // Check if video exists
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

     // Prevent duplicate videos
    if (Array.isArray(playlist.videos) && playlist.videos.includes(videoId)) {
        throw new ApiError(409, "Video already exists in the playlist");
    }

    // Add video to playlist
    playlist.videos.push(videoId);
    await playlist.save();

    return res.status(200).json(
        new ApiResponse(200, playlist, "Video added to playlist successfully")
    );
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist
    // Validate IDs
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid Playlist ID");
    }
     if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Video ID");
    }

    // Check playlist existence
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

      // Check if the requester owns the playlist
    if (String(playlist.owner) !== String(req.user._id)) {
        throw new ApiError(403, "You do not have permission to modify this playlist");
    }

    // Check if video exists
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    const videoIndex = playlist.videos.indexOf(videoId);
    if (videoIndex === -1) {
        throw new ApiError(404, "Video not found in this playlist");
    }

      // Remove video from playlist
    playlist.videos.splice(videoIndex, 1);
    await playlist.save();

    return res.status(200).json(
        new ApiResponse(200, playlist, "Video removed from playlist successfully")
    );
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
        if(!isValidObjectId(playlistId)) throw new ApiError(400,"Invalid Playlist request");
        
        const playlist = await Playlist.findById(playlistId)
        if(!playlist) throw new ApiError(404,"Playlist FIle is missing");
        
        await playlist.deleteOne();
        return res.status(200).json(new ApiResponse(200,null,"Playlist deleted Succesfully"));
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    const { name, description } = req.body;

    // Validate playlistId
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid Playlist ID");
    }

    // Check if playlist exists
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    // Verify ownership
    if (String(playlist.owner) !== String(req.user._id)) {
        throw new ApiError(403, "You do not have permission to update this playlist");
    }

    // Update fields only if provided
    if (name) playlist.name = name;
    if (description) playlist.description = description;

    await playlist.save();

    return res.status(200).json(
        new ApiResponse(200, playlist, "Playlist updated successfully")
    );
});


export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}