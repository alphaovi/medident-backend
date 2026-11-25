import { Schema, model } from "mongoose";
import { IAssetsSubGroupDocument } from "./assetsSubGroup.interface.js";

const assetsSubGroupSchema = new Schema<IAssetsSubGroupDocument>(
  {
    groupId: {
      type: Schema.Types.ObjectId,
      ref: "AssetsGroup",
      required: [true, "Asset group ID is required"],
    },
    subGroupName: {
      type: String,
      required: [true, "Asset sub-group name is required"],
      trim: true,
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

// একই Group-এর ভেতরে যেন একই নামে দুটি SubGroup তৈরি না হয়
assetsSubGroupSchema.index({ groupId: 1, subGroupName: 1 }, { unique: true });

export const AssetsSubGroup = model<IAssetsSubGroupDocument>(
  "AssetsSubGroup",
  assetsSubGroupSchema
);