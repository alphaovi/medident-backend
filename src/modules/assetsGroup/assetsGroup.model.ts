import { Schema, model } from "mongoose";
import { IAssetsGroupDocument } from "./assetsGroup.interface.js";

const assetsGroupSchema = new Schema<IAssetsGroupDocument>(
  {
    groupName: {
      type: String,
      required: [true, "Asset group name is required"],
      trim: true,
      unique: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const AssetsGroup = model<IAssetsGroupDocument>(
  "AssetsGroup",
  assetsGroupSchema
);
