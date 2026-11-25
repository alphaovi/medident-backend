import { Document, Types } from "mongoose";

export type TDepreciationPeriod = "monthly" | "yearly";
export type TDepreciationMode = "amount" | "percentage";

export type IAssetItem = {
  assetName: string; // কী কিনেছে (যেমন: Laptop, Printer, AC)
  assetCode?: string;
  purchaseDate: Date | string; // কবে কিনেছে
  quantity: number; // কয়টা কিনেছে
  unitPrice: number; // প্রতিটির কেনা দাম (টাকায়)
  totalCost?: number; // মোট কেনা দাম = quantity * unitPrice

  // Depreciation কনফিগারেশন
  depreciationPeriod: TDepreciationPeriod; // "monthly" | "yearly"
  depreciationMode: TDepreciationMode; // "amount" (টাকা) | "percentage" (%)
  depreciationValue: number; // কত টাকা বা কত % করে কাটবে
  elapsedPeriods?: number; // কেনার পর থেকে কত মাস বা বছর পার হয়েছে

  // হিসাবকৃত Depreciation তথ্য
  depreciationPerPeriod?: number; // প্রতি মাস বা বছরে কত টাকা কাটছে
  depreciatedAmount?: number; // এখন পর্যন্ত কত টাকা কাটা হয়েছে
  remainingDepreciableAmount?: number; // ভবিষ্যতে আর কত টাকা কাটবে (Current Book Value)
  isFullyDepreciated?: boolean;

  // ভিউ/রিপোর্টে সহজে দেখার জন্য মানবপাঠযোগ্য সারসংক্ষেপ
  depreciationSummary?: string;

  notes?: string;
};

export type IAssets = {
  assetsGroup: Types.ObjectId;
  assetsSubGroup: Types.ObjectId;
  assets: IAssetItem[];

  // পুরো ডকুমেন্টের সারসংক্ষেপ
  totalQuantity?: number;
  grandTotalCost?: number; // মোট কেনা দাম
  totalDepreciatedAmount?: number; // এখন পর্যন্ত মোট কাটা depreciation
  totalRemainingDepreciableAmount?: number; // ভবিষ্যতে মোট আর কত depreciation কাটবে

  createdAt?: Date | string;
  updatedAt?: Date | string;
};

export type IAssetsDocument = IAssets & Document;