import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { API_ROUTE, CORS_ORIGIN } from "@/constants";

const app = express();

app.use(
  cors({
    origin: [CORS_ORIGIN, "http://localhost:3000"],
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

//routes import
import userRouter from "@/routes/user.routes";
import healthcheckRouter from "@/routes/healthcheck.routes";
import tweetRouter from "@/routes/tweet.routes";
import subscriptionRouter from "@/routes/subscription.routes";
import videoRouter from "@/routes/video.routes";
import commentRouter from "@/routes/comment.routes";
import likeRouter from "@/routes/like.routes";
import playlistRouter from "@/routes/playlist.routes";
import dashboardRouter from "@/routes/dashboard.routes";

//routes declaration
app.use(`${API_ROUTE}/users`, userRouter);
app.use(`${API_ROUTE}/subscriptions`, subscriptionRouter);
app.use(`${API_ROUTE}/videos`, videoRouter);
app.use(`${API_ROUTE}/dashboard`, dashboardRouter);
app.use(`${API_ROUTE}/playlist`, playlistRouter);
app.use(`${API_ROUTE}/comments`, commentRouter);
app.use(`${API_ROUTE}/tweets`, tweetRouter);
app.use(`${API_ROUTE}/likes`, likeRouter);
app.use(`${API_ROUTE}/healthcheck`, healthcheckRouter);

// http://localhost:8000/api/v1/users/register

export { app };
