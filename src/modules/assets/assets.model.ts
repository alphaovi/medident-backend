import { Schema, model } from "mongoose";
import { IAssetItem, IAssetsDocument } from "./assets.interface.js";

const assetItemSchema = new Schema<IAssetItem>(
  {
    assetName: {
      type: String,
      required: [true, "Asset name is required"],
      trim: true,
    },
    assetCode: {
      type: String,
      trim: true,
      default: "",
    },
    purchaseDate: {
      type: Date,
      required: [true, "Purchase date is required"],
      default: Date.now,
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [1, "Quantity must be at least 1"],
    },
    unitPrice: {
      type: Number,
      required: [true, "Unit price is required"],
      min: [0, "Unit price cannot be negative"],
    },
    totalCost: {
      type: Number,
      default: 0,
      min: [0, "Total cost cannot be negative"],
    },
    depreciationPeriod: {
      type: String,
      enum: ["monthly", "yearly"],
      required: [true, "Depreciation period (monthly/yearly) is required"],
      default: "yearly",
    },
    depreciationMode: {
      type: String,
      enum: ["amount", "percentage"],
      required: [true, "Depreciation mode (amount/percentage) is required"],
      default: "percentage",
    },
    depreciationValue: {
      type: Number,
      required: [true, "Depreciation value is required"],
      min: [0, "Depreciation value cannot be negative"],
    },
    elapsedPeriods: {
      type: Number,
      default: 0,
      min: [0, "Elapsed periods cannot be negative"],
    },
    depreciationPerPeriod: {
      type: Number,
      default: 0,
      min: [0, "Depreciation per period cannot be negative"],
    },
    depreciatedAmount: {
      type: Number,
      default: 0,
      min: [0, "Depreciated amount cannot be negative"],
    },
    remainingDepreciableAmount: {
      type: Number,
      default: 0,
      min: [0, "Remaining depreciable amount cannot be negative"],
    },
    isFullyDepreciated: {
      type: Boolean,
      default: false,
    },
    depreciationSummary: {
      type: String,
      default: "",
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: true }
);

const assetsSchema = new Schema<IAssetsDocument>(
  {
    assetsGroup: {
      type: Schema.Types.ObjectId,
      ref: "AssetsGroup",
      required: [true, "Asset group is required"],
    },
    assetsSubGroup: {
      type: Schema.Types.ObjectId,
      ref: "AssetsSubGroup",
      required: [true, "Asset sub-group is required"],
    },
    assets: {
      type: [assetItemSchema],
      validate: {
        validator: (val: IAssetItem[]) => Array.isArray(val) && val.length > 0,
        message: "At least one asset item is required in assets array",
      },
    },
    totalQuantity: {
      type: Number,
      default: 0,
    },
    grandTotalCost: {
      type: Number,
      default: 0,
    },
    totalDepreciatedAmount: {
      type: Number,
      default: 0,
    },
    totalRemainingDepreciableAmount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const Assets = model<IAssetsDocument>("Assets", assetsSchema);