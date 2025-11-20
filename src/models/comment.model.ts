import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

export interface ICommentDocument extends mongoose.Document {
  content: string;
  video: Schema.Types.ObjectId;
  owner: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IComment extends ICommentDocument, mongoose.Document {}

const commentSchema = new Schema<ICommentDocument>(
  {
    content: { type: String, required: true },
    video: { type: Schema.Types.ObjectId, ref: "Video" },
    owner: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

commentSchema.plugin(mongooseAggregatePaginate);

export const Comment = mongoose.model<ICommentDocument>(
  "Comment",
  commentSchema
);
