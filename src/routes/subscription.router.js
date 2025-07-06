import { Router } from 'express';
import {
  getSubscribedChannels,
  getUserChannelSubscribers,
  toggleSubscription,
} from "../controllers/subscription.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// 🔐 Protect all routes
router.use(verifyJWT);

// ✅ Toggle subscribe/unsubscribe to a channel
// POST /subscriptions/c/:channelId
router.post("/c/:channelId", toggleSubscription);

// ✅ Get all subscribers of a channel
// GET /subscriptions/c/:channelId/subscribers
router.get("/c/:channelId/subscribers", getUserChannelSubscribers);

// ✅ Get list of channels current user is subscribed to
// GET /subscriptions
router.get("/", getSubscribedChannels);

export default router;
