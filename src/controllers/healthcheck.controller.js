import { ApiError } from "../utils/APiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


export const healthcheck = asyncHandler(async (req, res) => {
    res.status(200).json({
        status: "OK",
        message: "Server is up and running",
        timestamp: new Date().toISOString()
    });
});

    