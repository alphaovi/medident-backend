import { Types } from "mongoose";

export type Inventory = {
  product: Types.ObjectId;
  group: Types.ObjectId;
  subGroup: Types.ObjectId;
  totalStock: number;
  totalSell: number;
  currentStock: number;
  onTransit: number;
  damaged: number;
  lost: number;
  freeSample: number;
  avgBuyingPrice: number;
  totalStockValue: number;
  totalSaleValue: number;
};