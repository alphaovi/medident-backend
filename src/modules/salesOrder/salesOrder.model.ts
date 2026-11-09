import { Schema, model } from 'mongoose';
import { ISaleOrder, ISaleOrderItem, IPaymentRecord } from './salesOrder.interface.js';

const paymentRecordSchema = new Schema<IPaymentRecord>({
  date: { type: Date, default: Date.now },
  amount: { type: Number, required: true, min: 0 },
  paymentMethod: { type: String, default: 'Cash' }
});

const saleOrderItemSchema = new Schema<ISaleOrderItem>({
  state: { type: String, required: true, trim: true },
  customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
  group: { type: String, required: true, trim: true },
  subGroup: { type: String, required: true, trim: true },
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  discountType: { type: String, enum: ['percentage', 'fixed'], required: true },
  discountValue: { type: Number, required: true, min: 0 },
  discountAmount: { type: Number, required: true, default: 0 },
  totalPrice: { type: Number, required: true, default: 0 },
  afterDiscount: { type: Number, required: true, default: 0 }
});

const saleOrderSchema = new Schema<ISaleOrder>(
  {
    orderDate: { type: Date, default: Date.now },
    products: [saleOrderItemSchema],
    generalDiscountType: { type: String, enum: ['percentage', 'fixed'], default: 'fixed' },
    generalDiscountValue: { type: Number, default: 0, min: 0 },
    generalDiscountAmount: { type: Number, default: 0 },
    subTotal: { type: Number, required: true, default: 0 },
    grandTotal: { type: Number, required: true, default: 0 },
    paidAmount: { type: Number, required: true, default: 0 },
    dueAmount: { type: Number, required: true, default: 0 },
    payments: [paymentRecordSchema],
    status: { type: String, enum: ['pending', 'approved', 'delivered'], default: 'pending' }
  },
  {
    timestamps: true
  }
);

export const SaleOrder = model<ISaleOrder>('SaleOrder', saleOrderSchema);