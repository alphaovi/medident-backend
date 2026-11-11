import { Schema, Document } from "mongoose";

export type ISaleOrderItem = {
  state: string;
  customer: Schema.Types.ObjectId;
  group: Schema.Types.ObjectId;
  subGroup: Schema.Types.ObjectId;
  product: Schema.Types.ObjectId;
  quantity: number;
  unitPrice: number;
  discountType: "percentage" | "fixed";
  discountValue: number;
  discountAmount: number;
  totalPrice: number;
  afterDiscount: number;
};

export type IPaymentHistory = {
  date: Date;
  amount: number;
  paymentMethod?: string;
};

export type ISaleOrder = Document & {
  stateOrRegion: string;
  customer: Schema.Types.ObjectId;
  orderDate: Date;
  products: ISaleOrderItem[];
  generalDiscountType: "percentage" | "fixed";
  generalDiscountValue: number;
  subtotal: number;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  payments: IPaymentHistory[];
  status: "pending" | "approved" | "delivered" | "cancelled";
};