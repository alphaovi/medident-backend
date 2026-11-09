import { Document, Types } from "mongoose";

export type ISellReturnPayment = {
  date: Date;
  amount: number;
  paymentMethod?: string;
  reference?: string;
};

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
  paidAmount: number; // <--- 새로 যোগ করা হয়েছে
  payments: ISellReturnPayment[]; // <--- পেমেন্ট হিস্ট্রি অ্যারে
  status: "completed" | "pending";
  createdAt: Date;
  updatedAt: Date;
};