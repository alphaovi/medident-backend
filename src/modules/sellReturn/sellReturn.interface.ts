import { Document, Types } from "mongoose";

export type ISellReturnItem = {
  state: string;
  customer: Types.ObjectId;
  group: Types.ObjectId;
  subGroup: Types.ObjectId;
  product: Types.ObjectId;
  quantity: number;
  unitPrice: number;
  discountType: "percentage" | "fixed";
  discountValue: number;
  discountAmount: number;
  totalPrice: number;
  afterDiscount: number;
};

export type ISellReturn = Document & {
  stateOrRegion: string;
  customer: Types.ObjectId;
  returnDate: Date;
  products: ISellReturnItem[];
  generalDiscountType: "percentage" | "fixed";
  generalDiscountValue: number;
  grandTotal: number;
  status: "completed" | "pending";
  createdAt: Date;
  updatedAt: Date;
};