import { Schema, model, models, type Model, type Types } from "mongoose";

export interface IFunnel {
  _id: Types.ObjectId;
  site: Types.ObjectId;
  name: string;
  steps: string[];
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const funnelSchema = new Schema<IFunnel>(
  {
    site: {
      type: Schema.Types.ObjectId,
      ref: "Site",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    steps: {
      type: [String],
      required: true,
      validate: {
        validator: (value: string[]) =>
          value.length >= 1 &&
          value.length <= 10 &&
          value.every((step) => step.trim().length > 0),
        message: "A funnel needs between 1 and 10 non-empty steps",
      },
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

funnelSchema.index({ site: 1, createdAt: -1 });

export const Funnel: Model<IFunnel> =
  (models.Funnel as Model<IFunnel>) || model<IFunnel>("Funnel", funnelSchema);
