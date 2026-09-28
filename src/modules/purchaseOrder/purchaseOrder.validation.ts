import { z } from "zod";

const purchaseOrderItemValidation =
  z.object({
    group: z
      .string()
      .trim()
      .min(1, "Group is required"),

    subGroup: z
      .string()
      .trim()
      .min(1, "Sub-group is required"),

    product: z
      .string()
      .trim()
      .min(1, "Product is required"),

    orderQuantity: z
      .number()
      .int()
      .min(1, "Order quantity must be at least 1"),

    weight: z
      .number()
      .min(0, "Weight cannot be negative"),

    price: z
      .number()
      .min(0, "Price cannot be negative"),
  });

export const createPurchaseOrderValidation =
  z.object({
    body: z.object({
      purchaseOrder: z.object({
        purchaseId: z
          .string()
          .trim()
          .min(1, "Purchase ID is required"),

        purchaseDate: z
          .union([
            z.string().min(1),
            z.date(),
          ]),

        expectedDeliveryDate: z
          .union([
            z.string().min(1),
            z.date(),
          ]),

        supplierName: z
          .string()
          .trim()
          .min(1, "Supplier is required"),

        items: z
          .array(purchaseOrderItemValidation)
          .min(
            1,
            "At least one product is required"
          ),

        shippingCost: z
          .number()
          .min(0)
          .default(0),

        transitCost: z
          .number()
          .min(0)
          .default(0),

        vatType: z
          .enum(["%", "flat"])
          .default("%"),

        vatValue: z
          .number()
          .min(0)
          .default(0),

        otherCost: z
          .number()
          .min(0)
          .default(0),
      }),
    }),
  });