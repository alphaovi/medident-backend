import { Types } from "mongoose";

export type Inventory = {
  product: Types.ObjectId;
  totalStock: number;
  totalSell: number;
  currentStock: number;
  avgBuyingPrice: number;
  totalStockValue: number;
  totalSaleValue: number;
};