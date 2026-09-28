import { Schema, model } from "mongoose";
import { OrderItem, SaleOrder } from "./salesOrder.interface.js";


const orderItemSchema = new Schema<OrderItem>(
  {
    group: {
      type: Schema.Types.ObjectId,
      ref: "ProductGroup",
      required: true,
    },

    subGroup: {
      type: Schema.Types.ObjectId,
      ref: "ProductSubgroup",
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
      min: 1,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    discount: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    afterDiscount: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    _id: false,
  }
);

const saleOrderSchema = new Schema<SaleOrder>(
  {
    stateOrRegion: {
      type: String,
      required: true,
      trim: true,
    },

    customer: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },

    orderDate: {
      type: Date,
      required: true,
    },

    products: {
      type: [orderItemSchema],
      required: true,

      validate: {
        validator: (value: OrderItem[]) => value.length > 0,

        message: "At least one product is required",
      },
    },

    generalDiscountType: {
      type: String,
      enum: ["%", "flat"],
    },

    generalDiscountValue: {
      type: Number,
      default: 0,
      min: 0,
    },

    paidAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    grandTotal: {
      type: Number,
      required: true,
      min: 0,
    },

    dueAmount: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const SaleOrderModel = model<SaleOrder>("SaleOrder", saleOrderSchema);
