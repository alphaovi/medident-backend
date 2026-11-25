import { Schema, model } from "mongoose";
import { IAssetSellItem, IAssetsSellDocument } from "./assetsSell.interface.js";

const assetSellItemSchema = new Schema<IAssetSellItem>(
  {
    assetsRecordId: {
      type: Schema.Types.ObjectId,
      ref: "Assets",
      required: [true, "Assets record ID is required"],
    },
    assetItemId: {
      type: Schema.Types.ObjectId,
      required: [true, "Asset item ID is required"],
    },
    sellQuantity: {
      type: Number,
      required: [true, "Sell quantity is required"],
      min: [1, "Sell quantity must be at least 1"],
    },
    sellPrice: {
      type: Number,
      required: [true, "Sell price is required"],
      min: [0, "Sell price cannot be negative"],
    },
    purchaseUnitPrice: {
      type: Number,
      default: 0,
    },
    currentBookValuePerUnit: {
      type: Number,
      default: 0,
    },
    totalSellAmount: {
      type: Number,
      default: 0,
    },
    purchaseCostForSold: {
      type: Number,
      default: 0,
    },
    bookValueForSold: {
      type: Number,
      default: 0,
    },
    profitOrLoss: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: true }
);

const assetsSellSchema = new Schema<IAssetsSellDocument>(
  {
    invoiceNo: {
      type: String,
      trim: true,
      unique: true,
    },
    sellDate: {
      type: Date,
      default: Date.now,
    },
    assetsGroup: {
      type: Schema.Types.ObjectId,
      ref: "AssetsGroup",
      required: [true, "Asset group ID is required"],
    },
    assetsSubGroup: {
      type: Schema.Types.ObjectId,
      ref: "AssetsSubGroup",
      required: [true, "Asset sub-group ID is required"],
    },
    depositToBank: {
      type: Schema.Types.ObjectId,
      ref: "BanksDetail",
      default: null,
    },
    customerName: {
      type: String,
      trim: true,
      default: "",
    },
    customerPhone: {
      type: String,
      trim: true,
      default: "",
    },
    soldItems: {
      type: [assetSellItemSchema],
      validate: {
        validator: (val: IAssetSellItem[]) => Array.isArray(val) && val.length > 0,
        message: "At least one sold item is required",
      },
    },
    totalSoldQuantity: {
      type: Number,
      default: 0,
    },
    grandTotalSellAmount: {
      type: Number,
      default: 0,
    },
    grandPurchaseCostForSold: {
      type: Number,
      default: 0,
    },
    grandBookValueForSold: {
      type: Number,
      default: 0,
    },
    grandProfitOrLoss: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

assetsSellSchema.pre("save", function (next) {
  if (!this.invoiceNo) {
    const randomPart = Math.floor(100000 + Math.random() * 900000);
    this.invoiceNo = `ASL-${Date.now().toString().slice(-5)}-${randomPart}`;
  }
  next();
});

export const AssetsSell = model<IAssetsSellDocument>(
  "AssetsSell",
  assetsSellSchema
);