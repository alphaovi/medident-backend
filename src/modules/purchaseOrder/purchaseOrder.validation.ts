import { z } from "zod";

const purchaseOrderItemZodSchema = z.object({
  group: z.string({ required_error: "Group is required" }),
  subGroup: z.string({ required_error: "SubGroup is required" }),
  product: z.string({ required_error: "Product ID is required" }),
  currentStock: z.number().optional().default(0),
  inTransit: z.number().optional().default(0),
  orderQuantity: z.number({ required_error: "Order quantity is required" }),
  price: z.number({ required_error: "Price is required" }),
  weight: z.number().optional().default(0),
  shippingCost: z.number().optional().default(0),
  vatAmount: z.number().optional().default(0),
  transitCost: z.number().optional().default(0),
  otherCost: z.number().optional().default(0),
  unitCost: z.number({ required_error: "Unit cost is required" }),
  totalCost: z.number({ required_error: "Total cost is required" }),
  status: z.enum(["Ordered", "On Transit", "Received"]).default("Ordered").optional(),
});

const createPurchaseOrderZodSchema = z.object({
  body: z.object({
    purchaseId: z.string({ required_error: "Purchase ID is required" }),
    expectedDeliveryDate: z.string({ required_error: "Expected delivery date is required" }),
    supplierName: z.string({ required_error: "Supplier name/ID is required" }),
    items: z.array(purchaseOrderItemZodSchema, { required_error: "Items are required" }),
    shippingCost: z.number().optional().default(0),
    transitCost: z.number().optional().default(0),
    vatType: z.enum(["%", "flat"], { required_error: "VAT type is required" }),
    vatValue: z.number({ required_error: "VAT value is required" }),
    otherCost: z.number().optional().default(0),
    totalWeight: z.number().optional().default(0),
    baseSubtotal: z.number({ required_error: "Base subtotal is required" }),
    grandTotal: z.number({ required_error: "Grand total is required" }),
    // কেউ রিকোয়েস্টে স্ট্যাটাস না পাঠালে বা অন্য কিছু পাঠাতে চাইলে তা হ্যান্ডেল করার জন্য
    status: z.enum(["Ordered", "On Transit", "Received"]).default("Ordered").optional(),
  }),
});

const updatePurchaseOrderZodSchema = z.object({
  body: createPurchaseOrderZodSchema.shape.body.partial(),
});

export const PurchaseOrderValidation = {
  createPurchaseOrderZodSchema,
  updatePurchaseOrderZodSchema,
};