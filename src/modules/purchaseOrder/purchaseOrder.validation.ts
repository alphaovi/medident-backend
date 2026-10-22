import { z } from "zod";

// Create er jonno item schema (ekhane required thakbe)
const purchaseOrderItemValidationSchema = z.object({
  group: z.string({ required_error: "Group is required" }),
  subGroup: z.string({ required_error: "SubGroup is required" }),
  product: z.string({ required_error: "Product is required" }),
  currentStock: z.number().default(0),
  inTransit: z.number().default(0),
  orderQuantity: z.number({ required_error: "Order quantity is required" }),
  price: z.number({ required_error: "Price is required" }),
  weight: z.number().default(0),
  shippingCost: z.number().default(0),
  vatAmount: z.number().default(0),
  transitCost: z.number().default(0),
  otherCost: z.number().default(0),
  unitCost: z.number({ required_error: "Unit cost is required" }),
  totalCost: z.number({ required_error: "Total cost is required" }),
  status: z.enum(["Ordered", "On Transit", "Received"]).default("Ordered"),
});

// Update er jonno item schema - ekhane group ebong subGroup ke .optional() kore dewa hoyeche jate partial update korleo error na ase
const updatePurchaseOrderItemValidationSchema = z.object({
  group: z.string().optional(),
  subGroup: z.string().optional(),
  product: z.string().optional(),
  currentStock: z.number().optional(),
  inTransit: z.number().optional(),
  orderQuantity: z.number().optional(),
  price: z.number().optional(),
  weight: z.number().optional(),
  shippingCost: z.number().optional(),
  vatAmount: z.number().optional(),
  transitCost: z.number().optional(),
  otherCost: z.number().optional(),
  unitCost: z.number().optional(),
  totalCost: z.number().optional(),
  status: z.enum(["Ordered", "On Transit", "Received"]).optional(),
});

const createPurchaseOrderZodSchema = z.object({
  body: z.object({
    purchaseId: z.string({ required_error: "Purchase ID is required" }),
    purchaseDate: z.string().optional().transform((val) => (val ? new Date(val) : new Date())),
    expectedDeliveryDate: z.string({ required_error: "Expected delivery date is required" }).transform((val) => new Date(val)),
    supplierName: z.string({ required_error: "Supplier name is required" }),
    items: z.array(purchaseOrderItemValidationSchema),
    shippingCost: z.number().default(0),
    transitCost: z.number().default(0),
    vatType: z.enum(["%", "flat"], { required_error: "VAT type is required" }),
    vatValue: z.number().default(0),
    otherCost: z.number().default(0),
    totalWeight: z.number().default(0),
    baseSubtotal: z.number({ required_error: "Base subtotal is required" }),
    grandTotal: z.number({ required_error: "Grand total is required" }),
    status: z.enum(["Ordered", "On Transit", "Received"]).default("Ordered"),
  }),
});

const updatePurchaseOrderZodSchema = z.object({
  body: z.object({
    purchaseId: z.string().optional(),
    purchaseDate: z.string().optional().transform((val) => (val ? new Date(val) : undefined)),
    expectedDeliveryDate: z.string().optional().transform((val) => (val ? new Date(val) : undefined)),
    supplierName: z.string().optional(),
    // Ekhane updatePurchaseOrderItemValidationSchema use kora hoyeche
    items: z.array(updatePurchaseOrderItemValidationSchema).optional(),
    shippingCost: z.number().optional(),
    transitCost: z.number().optional(),
    vatType: z.enum(["%", "flat"]).optional(),
    vatValue: z.number().optional(),
    otherCost: z.number().optional(),
    totalWeight: z.number().optional(),
    baseSubtotal: z.number().optional(),
    grandTotal: z.number().optional(),
    status: z.enum(["Ordered", "On Transit", "Received"]).optional(),
  }),
});

export const PurchaseOrderValidation = {
  createPurchaseOrderZodSchema,
  updatePurchaseOrderZodSchema,
};