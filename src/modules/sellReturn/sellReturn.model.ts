import { Schema, model } from "mongoose";
import { ISellReturn, ISellReturnItem } from "./sellReturn.interface.js";

const sellReturnPaymentSchema = new Schema({
  date: { type: Date, default: Date.now },
  amount: { type: Number, required: true },
  paymentMethod: { type: String, default: "Cash" },
  reference: { type: String, default: "" },
});

const sellReturnItemSchema = new Schema<ISellReturnItem>({
  state: { type: String, required: true },
  customer: { type: Schema.Types.ObjectId, ref: "Customer", required: true },
  group: { type: Schema.Types.ObjectId, ref: "ProductGroup", required: true },
  subGroup: { type: Schema.Types.ObjectId, ref: "ProductSubgroup", required: true },
  product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true },
  discountType: { type: String, enum: ["percentage", "fixed"], default: "percentage" },
  discountValue: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  totalPrice: { type: Number, required: true },
  afterDiscount: { type: Number, required: true },
});

const sellReturnSchema = new Schema<ISellReturn>(
  {
    stateOrRegion: { type: String, required: true },
    customer: { type: Schema.Types.ObjectId, ref: "Customer", required: true },
    returnDate: { type: Date, required: true, default: Date.now },
    products: [sellReturnItemSchema],
    generalDiscountType: { type: String, enum: ["percentage", "fixed"], default: "percentage" },
    generalDiscountValue: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },
    paidAmount: { type: Number, default: 0 }, // <--- 추가
    payments: [sellReturnPaymentSchema], // <--- 추가
    status: { type: String, enum: ["completed", "pending"], default: "completed" },
  },
  { timestamps: true }
);

export const SellReturnModel = model<ISellReturn>("SellReturn", sellReturnSchema);