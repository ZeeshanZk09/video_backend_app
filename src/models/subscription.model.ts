import mongoose, { Schema } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

export interface ISubscription {
  subscriber: Schema.Types.ObjectId;
  channel: Schema.Types.ObjectId;
}

export interface ISubscriptionDocument
  extends ISubscription,
    mongoose.Document {}

const subscriptionSchema = new Schema<ISubscriptionDocument>(
  {
    subscriber: {
      type: Schema.Types.ObjectId, // one who is subscribing
      ref: "User",
    },
    channel: {
      type: Schema.Types.ObjectId, // one to whom 'subscriber' is subscribing
      ref: "User",
    },
  },
  { timestamps: true }
);

subscriptionSchema.plugin(mongoosePaginate);

export const Subscription = mongoose.model<ISubscriptionDocument>(
  "Subscription",
  subscriptionSchema
);
