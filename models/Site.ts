import { Schema, model, models, type Model, type Types } from "mongoose";

export interface ISite {
  _id: Types.ObjectId;
  owner: Types.ObjectId;
  name: string;
  domain: string;
  trackingId: string;
  eventsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const siteSchema = new Schema<ISite>(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    domain: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 253,
    },
    trackingId: { type: String, required: true, unique: true, trim: true },
    eventsCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

siteSchema.index({ owner: 1, createdAt: -1 });

export const Site: Model<ISite> =
  (models.Site as Model<ISite>) || model<ISite>("Site", siteSchema);
