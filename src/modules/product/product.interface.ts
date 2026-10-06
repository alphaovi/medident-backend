import { Types } from "mongoose";

export type ProductDetails = {
  id: string;
  name: string;
  code: string;
  group: Types.ObjectId;
  subGroup: Types.ObjectId;
  unit: string;
  weight: number;
  purchasePrice: number;
  sellingPrice: number;
};