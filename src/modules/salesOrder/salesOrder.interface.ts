import { Types } from "mongoose";

export type OrderStatus = "pending" | "approved" | "delivered";

export type OrderItem = {
  group: Types.ObjectId;
  subGroup: Types.ObjectId;
  product: Types.ObjectId;
  quantity: number;
  price: number;
  discountType: "percent" | "flat"; // Strict mandatory
  discountValue: number;            // Strict mandatory
  discount: number;
  totalPrice: number;
  afterDiscount: number;
};

export type ISaleOrder = {
  stateOrRegion: string;
  customer: Types.ObjectId;
  orderDate: Date;
  products: OrderItem[];
  generalDiscountType?: "%" | "flat";
  generalDiscountValue?: number;
  paidAmount: number;
  dueAmount: number;
  grandTotal: number;
  payments: { amount: number; date: Date }[];
  status: OrderStatus;
};