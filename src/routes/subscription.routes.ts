import { Router } from "express";
import {
  getSubscribedChannels,
  getUserChannelSubscribers,
  toggleSubscription,
} from "@/controllers/subscription.controller";
import { verifyJWT } from "@/middlewares/auth.middleware";

const router = Router();

router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.use((req, res, next) => {
  console.log(`Subscription Route: ${req.method} ${req.path}`);
  console.log("Params:", req.params);
  next();
});

router.route("/toggle/:channelId").post(toggleSubscription);
router.route("/subscribers/:channelId").get(getUserChannelSubscribers);
router.route("/channels/:subscriberId").get(getSubscribedChannels);

export default router;
