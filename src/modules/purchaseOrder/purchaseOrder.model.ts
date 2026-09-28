import { Schema, model } from "mongoose";
import {
  PurchaseOrder,
  PurchaseOrderItem,
} from "./purchaseOrder.interface.js";

const purchaseOrderItemSchema =
  new Schema<PurchaseOrderItem>(
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

      currentStock: {
        type: Number,
        required: true,
        min: 0,
      },

      inTransit: {
        type: Number,
        required: true,
        min: 0,
      },

      orderQuantity: {
        type: Number,
        required: true,
        min: 1,
      },

      price: {
        type: Number,
        required: true,
        min: 0,
      },

      weight: {
        type: Number,
        required: true,
        min: 0,
      },

      shippingCost: {
        type: Number,
        required: true,
        min: 0,
      },

      vatAmount: {
        type: Number,
        required: true,
        min: 0,
      },

      transitCost: {
        type: Number,
        required: true,
        min: 0,
      },

      otherCost: {
        type: Number,
        required: true,
        min: 0,
      },

      unitCost: {
        type: Number,
        required: true,
        min: 0,
      },

      totalCost: {
        type: Number,
        required: true,
        min: 0,
      },

      status: {
        type: String,
        enum: ["Pending", "Received"],
        default: "Pending",
      },
    },
    {
      _id: true,
    }
  );

const purchaseOrderSchema =
  new Schema<PurchaseOrder>(
    {
      purchaseId: {
        type: String,
        required: true,
        unique: true,
        trim: true,
      },

      purchaseDate: {
        type: Date,
        required: true,
      },

      expectedDeliveryDate: {
        type: Date,
        required: true,
      },

      supplierName: {
        type: Schema.Types.ObjectId,
        ref: "Supplier",
        required: true,
      },

      items: {
        type: [purchaseOrderItemSchema],
        required: true,

        validate: {
          validator: (value: PurchaseOrderItem[]) =>
            value.length > 0,

          message:
            "At least one purchase product is required",
        },
      },

      shippingCost: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
      },

      transitCost: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
      },

      vatType: {
        type: String,
        enum: ["%", "flat"],
        default: "%",
      },

      vatValue: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
      },

      otherCost: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
      },

      totalWeight: {
        type: Number,
        required: true,
        min: 0,
      },

      baseSubtotal: {
        type: Number,
        required: true,
        min: 0,
      },

      grandTotal: {
        type: Number,
        required: true,
        min: 0,
      },

      status: {
        type: String,
        enum: [
          "Pending",
          "Partially Received",
          "Received",
        ],
        default: "Pending",
      },
    },
    {
      timestamps: true,
    }
  );

export const PurchaseOrderModel =
  model<PurchaseOrder>(
    "PurchaseOrder",
    purchaseOrderSchema
  );