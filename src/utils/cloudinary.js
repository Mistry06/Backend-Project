import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Uploads a file to Cloudinary with given options
 * @param {string} localFilePath - path to the file
 * @param {string} resourceType - "image", "video", or "auto"
 * @param {string} folder - folder name in Cloudinary
 */
export const uploadOnCloudinary = async (localFilePath, resourceType = "auto", folder = "") => {
    try {
        if (!localFilePath) return null;

        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: resourceType,
            folder: folder, // 👈 set the target folder
        });

        fs.unlinkSync(localFilePath); // delete local file after upload

        return response;
    } catch (error) {
        console.error("Cloudinary Upload Error:", error);
        return null;
    }
};
