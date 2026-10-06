import { Schema, model } from "mongoose";

const purchaseOrderItemSchema = new Schema(
  {
    group: { type: Schema.Types.ObjectId, ref: "ProductGroup", required: true },
    subGroup: { type: Schema.Types.ObjectId, ref: "ProductSubgroup", required: true },
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    currentStock: { type: Number, default: 0 },
    inTransit: { type: Number, default: 0 },
    orderQuantity: { type: Number, required: true },
    price: { type: Number, required: true },
    weight: { type: Number, default: 0 },
    shippingCost: { type: Number, default: 0 },
    vatAmount: { type: Number, default: 0 },
    transitCost: { type: Number, default: 0 },
    otherCost: { type: Number, default: 0 },
    unitCost: { type: Number, required: true },
    totalCost: { type: Number, required: true },
    status: { type: String, enum: ["Ordered", "On Transit", "Received"], default: "Ordered" },
  },
  { _id: false }
);

const purchaseOrderSchema = new Schema(
  {
    purchaseId: { type: String, required: true, unique: true },
    purchaseDate: { type: Date, default: Date.now },
    expectedDeliveryDate: { type: Date, required: true },
    supplierName: { type: Schema.Types.ObjectId, ref: "Supplier", required: true },
    items: [purchaseOrderItemSchema],
    shippingCost: { type: Number, default: 0 },
    transitCost: { type: Number, default: 0 },
    vatType: { type: String, enum: ["%", "flat"], required: true },
    vatValue: { type: Number, default: 0 },
    otherCost: { type: Number, default: 0 },
    totalWeight: { type: Number, default: 0 },
    baseSubtotal: { type: Number, required: true },
    grandTotal: { type: Number, required: true },
    status: { type: String, enum: ["Ordered", "On Transit", "Received"], default: "Ordered" },
  },
  { timestamps: true }
);

export const PurchaseOrderModel = model("PurchaseOrder", purchaseOrderSchema);