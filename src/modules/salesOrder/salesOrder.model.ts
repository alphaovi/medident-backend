import mongoose, { Schema } from "mongoose";

const OrderItemSchema = new Schema(
  {
    group: {
      type: Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },
    subGroup: {
      type: Schema.Types.ObjectId,
      ref: "SubGroup",
      required: true,
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0.01,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    discountType: {
      type: String,
      enum: ["percent", "flat"],
      required: true,
      default: "percent",
    },
    discountValue: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    discount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    afterDiscount: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const PaymentSchema = new Schema(
  {
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const SaleOrderSchema = new Schema(
  {
    stateOrRegion: {
      type: String,
      default: "",
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    orderDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    products: {
      type: [OrderItemSchema],
      required: true,
      validate: {
        validator: (value: unknown[]) => value.length > 0,
        message: "At least one product is required",
      },
    },
    generalDiscountType: {
      type: String,
      enum: ["%", "flat"],
      default: "%",
    },
    generalDiscountValue: {
      type: Number,
      default: 0,
      min: 0,
    },
    paidAmount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    payments: {
      type: [PaymentSchema],
      default: [],
    },
    grandTotal: {
      type: Number,
      required: true,
      default: 0,
    },
    dueAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "delivered"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

export const SaleOrderModel =
  mongoose.models.SaleOrder ||
  mongoose.model("SaleOrder", SaleOrderSchema);