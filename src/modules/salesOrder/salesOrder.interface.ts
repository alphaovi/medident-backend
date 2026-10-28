import { Types } from "mongoose";

export type OrderStatus = "pending" | "approved" | "delivered";

export type OrderItem = {
  group: Types.ObjectId;
  subGroup: Types.ObjectId;
  product: Types.ObjectId;
  quantity: number;
  price: number;
  discount?: number;
  totalPrice: number;
  afterDiscount: number;
};

// Payment record type for history
export type PaymentRecord = {
  amount: number;
  date: Date;
};

export type SaleOrder = {
  stateOrRegion: string;
  customer: Types.ObjectId;
  orderDate: Date;
  products: OrderItem[];
  generalDiscountType?: "%" | "flat";
  generalDiscountValue?: number;
  paidAmount: number;
  payments: PaymentRecord[]; // Date soho payment history array
  grandTotal: number;
  dueAmount: number;
  status: OrderStatus;
};