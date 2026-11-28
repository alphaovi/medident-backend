import { Document, Types } from "mongoose";

export type TDepreciationPeriod = "monthly" | "yearly";
export type TDepreciationMode = "percentage" | "amount";

export type IAssetItem = {
  _id?: Types.ObjectId;
  assetName: string;
  assetCode?: string;
  purchaseDate: Date | string;
  quantity: number;
  unitPrice: number;
  totalCost?: number;
  depreciationPeriod: TDepreciationPeriod;
  depreciationMode: TDepreciationMode;
  depreciationValue: number;

  // অটো ক্যালকুলেটেড ফিল্ড
  elapsedPeriods?: number;
  depreciationPerPeriod?: number;
  depreciatedAmount?: number;
  remainingDepreciableAmount?: number;
  isFullyDepreciated?: boolean;
  depreciationSummary?: string;
  notes?: string;
};

export type IAssets = {
  assetsGroup: Types.ObjectId;
  assetsSubGroup: Types.ObjectId;
  paidBy?: Types.ObjectId | null;
  paidFrom?: Types.ObjectId | null;
  assets: IAssetItem[];

  // সামারি ফিল্ড
  totalQuantity?: number;
  grandTotalCost?: number;
  totalDepreciatedAmount?: number;
  totalRemainingDepreciableAmount?: number;

  createdAt?: Date | string;
  updatedAt?: Date | string;
};

export type IAssetsDocument = IAssets & Document;