import { Document, Types } from 'mongoose';

export type DiscountType = 'percentage' | 'fixed';
export type OrderStatus = 'pending' | 'approved' | 'delivered';

export interface IPaymentRecord {
  date: Date;
  amount: number;
  paymentMethod?: string;
}

export interface ISaleOrderItem {
  state: string;
  customer: Types.ObjectId | string;
  group: string;
  subGroup: string;
  product: Types.ObjectId | string;
  quantity: number;
  unitPrice: number;
  discountType: DiscountType;
  discountValue: number;
  discountAmount: number;    
  totalPrice: number;        
  afterDiscount: number;     
}

export type SaleOrder = {
  stateOrRegion: string;
  customer: Types.ObjectId;
  orderDate: Date;
  products: ISaleOrderItem[];
  generalDiscountType: DiscountType;
  generalDiscountValue: number;
  generalDiscountAmount: number;
  subTotal: number;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  payments: IPaymentRecord[];
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
}