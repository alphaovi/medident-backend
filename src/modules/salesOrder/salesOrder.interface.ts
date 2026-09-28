import { Types } from "mongoose";

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

export type SaleOrder = {
  stateOrRegion: string;
  customer: Types.ObjectId;
  orderDate: Date;
  products: OrderItem[];
  generalDiscountType?: "%" | "flat";
  generalDiscountValue?: number;
  paidAmount: number;
  grandTotal: number;
  dueAmount: number;
};