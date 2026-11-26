import { Schema, model, models, type Model, type Types } from "mongoose";

export interface IDevice {
  browser: string;
  os: string;
  type: string;
}

export interface IEvent {
  _id: Types.ObjectId;
  site: Types.ObjectId;
  name: string;
  visitorId: string;
  eventId: string;
  url: string;
  referrer: string;
  device: IDevice;
  createdAt: Date;
  updatedAt: Date;
}

const deviceSchema = new Schema<IDevice>(
  {
    browser: { type: String, default: "" },
    os: { type: String, default: "" },
    type: { type: String, default: "desktop" },
  },
  { _id: false },
);

const eventSchema = new Schema<IEvent>(
  {
    site: {
      type: Schema.Types.ObjectId,
      ref: "Site",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    visitorId: { type: String, required: true, trim: true, maxlength: 200 },
    eventId: { type: String, required: true, trim: true, maxlength: 200 },
    url: { type: String, required: true, trim: true, maxlength: 2048 },
    referrer: { type: String, default: "", trim: true, maxlength: 2048 },
    device: { type: deviceSchema, default: () => ({}) },
  },
  { timestamps: true },
);

eventSchema.index({ site: 1, createdAt: -1 });
eventSchema.index({ site: 1, eventId: 1 }, { unique: true });
eventSchema.index({ site: 1, name: 1, createdAt: -1 });
eventSchema.index({ site: 1, url: 1 });
eventSchema.index({ site: 1, referrer: 1 });
eventSchema.index({ site: 1, visitorId: 1 });

export const Event: Model<IEvent> =
  (models.Event as Model<IEvent>) || model<IEvent>("Event", eventSchema);
