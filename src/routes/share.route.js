import express from "express";
import { shareVideo} from "../controllers/share.controller.js";
import {verifyJWT} from "../middlewares/auth.middleware.js"
import { Router } from "express";

const router = Router();

router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

// Route: POST /api/share/:videoId
// Desc: Share a video
// Access: Private (requires login)
router.post("/:videoId", shareVideo);



export default router;
