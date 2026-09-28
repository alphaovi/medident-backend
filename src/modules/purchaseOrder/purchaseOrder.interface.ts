import { Types } from "mongoose";

export type PurchaseOrderItemStatus =
  | "Pending"
  | "Received";

export type PurchaseOrderItem = {
  group: Types.ObjectId;
  subGroup: Types.ObjectId;
  product: Types.ObjectId;

  currentStock: number;
  inTransit: number;

  orderQuantity: number;

  price: number;
  weight: number;

  shippingCost: number;
  vatAmount: number;
  transitCost: number;
  otherCost: number;

  unitCost: number;
  totalCost: number;

  status: PurchaseOrderItemStatus;
};

export type PurchaseOrder = {
  purchaseId: string;

  purchaseDate: Date;
  expectedDeliveryDate: Date;

  supplierName: Types.ObjectId;

  items: PurchaseOrderItem[];

  shippingCost: number;
  transitCost: number;

  vatType: "%" | "flat";
  vatValue: number;

  otherCost: number;

  totalWeight: number;
  baseSubtotal: number;

  grandTotal: number;

  status: "Pending" | "Partially Received" | "Received";
};