import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

export interface IVideo {
  videoFile: { url: string; publicId: string };
  thumbnail: { url: string; publicId: string };
  title: string;
  description: string;
  duration: number;
  views: number;
  isPublished: boolean;
  owner: Schema.Types.ObjectId;
}

export interface IVideoDocument extends IVideo, mongoose.Document {}

const videoSchema = new Schema<IVideoDocument>(
  {
    videoFile: {
      url: { type: String, required: true },
      publicId: { type: String, required: true },
    },
    thumbnail: {
      url: { type: String, required: true },
      publicId: { type: String, required: true },
    },

    title: { type: String, required: true },
    description: { type: String, required: true },
    duration: { type: Number, required: true },
    views: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: true },
    owner: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

videoSchema.plugin(mongooseAggregatePaginate);

export const Video = mongoose.model<IVideoDocument>("Video", videoSchema);
