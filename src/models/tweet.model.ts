import mongoose, { PaginateModel, Schema } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

export interface ITweet {
  content: string;
  owner: Schema.Types.ObjectId;
}

export interface ITweetDocument extends ITweet, mongoose.Document {
  createdAt: Date;
  updatedAt: Date;
}

const tweetSchema = new Schema<ITweetDocument>(
  {
    content: { type: String, required: true },
    owner: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

tweetSchema.plugin(mongoosePaginate);

export const Tweet = mongoose.model<
  ITweetDocument,
  PaginateModel<ITweetDocument>
>("Tweet", tweetSchema);
