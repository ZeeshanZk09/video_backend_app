import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

//routes import
import userRouter from "./routes/user.routes.js";
import healthcheckRouter from "./routes/healthcheck.routes.js";
import tweetRouter from "./routes/tweet.routes.js";
import subscriptionRouter from "./routes/subscription.routes.js";
import videoRouter from "./routes/video.routes.js";
import commentRouter from "./routes/comment.routes.js";
import likeRouter from "./routes/like.routes.js";
import playlistRouter from "./routes/playlist.routes.js";
import dashboardRouter from "./routes/dashboard.routes.js";
import { API_ROUTE } from "./constants.js";

//routes declaration
app.use(`${API_ROUTE}/healthcheck`, healthcheckRouter);
app.use(`${API_ROUTE}/users`, userRouter);
app.use(`${API_ROUTE}/tweets`, tweetRouter);
app.use(`${API_ROUTE}/subscriptions`, subscriptionRouter);
app.use(`${API_ROUTE}/videos`, videoRouter);
app.use(`${API_ROUTE}/comments`, commentRouter);
app.use(`${API_ROUTE}/likes`, likeRouter);
app.use(`${API_ROUTE}/playlist`, playlistRouter);
app.use(`${API_ROUTE}/dashboard`, dashboardRouter);

// http://localhost:8000/api/v1/users/register

export { app };
