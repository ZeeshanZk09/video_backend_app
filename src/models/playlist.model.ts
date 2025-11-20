import mongoose, { AggregatePaginateModel, Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

export interface IPlaylist {
  name: string;
  description: string;
  thumbnail: { url: string; publicId: string };
  videos: Schema.Types.ObjectId[];
  owner: Schema.Types.ObjectId;
}

export interface IPlaylistDocument extends IPlaylist, mongoose.Document {}

const playlistSchema = new Schema<IPlaylistDocument>(
  {
    name: { type: String, required: true },
    description: { type: String },
    thumbnail: { url: String, publicId: String },
    videos: [{ type: Schema.Types.ObjectId, ref: "Video" }],
    owner: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

playlistSchema.plugin(mongooseAggregatePaginate);

export const Playlist = mongoose.model<
  IPlaylistDocument,
  AggregatePaginateModel<IPlaylistDocument>
>("Playlist", playlistSchema);
