import mongoose, { PaginateModel, Schema } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

export interface ILike {
  video: Schema.Types.ObjectId;
  comment: Schema.Types.ObjectId;
  tweet: Schema.Types.ObjectId;
  likedBy: Schema.Types.ObjectId;
}

export interface ILikeDocument extends ILike, mongoose.Document {}

const likeSchema = new Schema<ILikeDocument>(
  {
    video: { type: Schema.Types.ObjectId, ref: "Video" },
    comment: { type: Schema.Types.ObjectId, ref: "Comment" },
    tweet: { type: Schema.Types.ObjectId, ref: "Tweet" },
    likedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

likeSchema.plugin(mongoosePaginate);

export const Like = mongoose.model<ILikeDocument, PaginateModel<ILikeDocument>>(
  "Like",
  likeSchema
);
