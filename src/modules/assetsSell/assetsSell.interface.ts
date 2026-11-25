import { Document, Types } from "mongoose";

export type IAssetSellItem = {
  assetsRecordId: Types.ObjectId;
  assetItemId: Types.ObjectId;
  sellQuantity: number;
  sellPrice: number;

  // অটো ক্যালকুলেটেড ফিল্ড
  purchaseUnitPrice?: number;
  currentBookValuePerUnit?: number;
  totalSellAmount?: number;
  purchaseCostForSold?: number;
  bookValueForSold?: number;
  profitOrLoss?: number;
  notes?: string;
};

export type IAssetsSell = {
  invoiceNo?: string;
  sellDate?: Date | string;
  assetsGroup: Types.ObjectId;
  assetsSubGroup: Types.ObjectId;
  depositToBank?: Types.ObjectId | null;
  customerName?: string;
  customerPhone?: string;
  soldItems: IAssetSellItem[];

  // সামারি ফিল্ড
  totalSoldQuantity?: number;
  grandTotalSellAmount?: number;
  grandPurchaseCostForSold?: number;
  grandBookValueForSold?: number;
  grandProfitOrLoss?: number;
  notes?: string;

  createdAt?: Date | string;
  updatedAt?: Date | string;
};

export type IAssetsSellDocument = IAssetsSell & Document;