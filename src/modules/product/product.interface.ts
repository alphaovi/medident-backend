import { Types } from "mongoose";

export type ProductDetails = {
  id: string;
  name: string;
  group: Types.ObjectId;
  subGroup: Types.ObjectId;
  unit: number;
  weight: number;
  purchasePrice: number;
  sellingPrice: number;
  stock: number;
};