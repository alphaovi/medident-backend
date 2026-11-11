import { Schema, model } from "mongoose";
import { ISaleOrder } from "./salesOrder.interface.js";

const productItemSchema = new Schema(
  {
    state: { type: String, required: true },
    customer: { type: Schema.Types.ObjectId, ref: "Customer", required: true },
    group: { type: Schema.Types.ObjectId, ref: "ProductGroup", required: true },
    subGroup: { type: Schema.Types.ObjectId, ref: "ProductSubGroup", required: true },
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true, default: 1 },
    unitPrice: { type: Number, required: true, default: 0 },
    discountType: { type: String, enum: ["percentage", "fixed"], default: "percentage" },
    discountValue: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    totalPrice: { type: Number, default: 0 },
    afterDiscount: { type: Number, default: 0 },
  },
  { _id: false }
);

const paymentSchema = new Schema(
  {
    date: { type: Date, default: Date.now },
    amount: { type: Number, required: true },
    paymentMethod: { type: String, default: "Cash" },
  },
  { _id: false }
);

const salesOrderSchema = new Schema<ISaleOrder>(
  {
    id: { type: String },
    stateOrRegion: { type: String, required: true },
    customer: { type: Schema.Types.ObjectId, ref: "Customer", required: true },
    orderDate: { type: Date, default: Date.now },
    products: [productItemSchema],
    generalDiscountType: { type: String, enum: ["percentage", "fixed"], default: "percentage" },
    generalDiscountValue: { type: Number, default: 0 },
    paidAmount: { type: Number, default: 0 },
    dueAmount: { type: Number, default: 0 },
    grandTotal: { type: Number, default: 0 },
    payments: [paymentSchema],
    status: { type: String, default: "pending" },
  },
  {
    timestamps: true,
  }
);

// 🟢 Mongoose Async Pre-Save Hook (Calculation & Financial Logic)
salesOrderSchema.pre("save", async function () {
  let subtotal = 0;

  if (Array.isArray(this.products) && this.products.length > 0) {
    this.products.forEach((p) => {
      const qty = Number(p.quantity) || 0;
      const unitPrice = Number(p.unitPrice) || 0;
      const itemTotal = qty * unitPrice;

      let itemDiscountAmount = 0;
      const dVal = Number(p.discountValue) || 0;
      
      if (p.discountType === "percentage") {
        itemDiscountAmount = (itemTotal * dVal) / 100;
      } else {
        itemDiscountAmount = dVal;
      }

      p.discountAmount = itemDiscountAmount;
      p.totalPrice = itemTotal;
      p.afterDiscount = Math.max(0, itemTotal - itemDiscountAmount);

      subtotal += p.afterDiscount;
    });
  }

  let generalDiscountAmount = 0;
  const genVal = Number(this.generalDiscountValue) || 0;

  if (this.generalDiscountType === "percentage") {
    generalDiscountAmount = (subtotal * genVal) / 100;
  } else {
    generalDiscountAmount = genVal;
  }

  this.grandTotal = Math.max(0, subtotal - generalDiscountAmount);
  this.dueAmount = Math.max(0, this.grandTotal - (Number(this.paidAmount) || 0));
});

export const SalesOrderModel = model<ISaleOrder>("SalesOrder", salesOrderSchema);