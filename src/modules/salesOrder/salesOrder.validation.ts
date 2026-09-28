import { z } from "zod";

const orderItemValidationSchema =
  z.object({
    group: z
      .string({
        error: "Group ID is required",
      })
      .trim()
      .min(1, "Group ID is required"),

    subGroup: z
      .string({
        error: "Sub-group ID is required",
      })
      .trim()
      .min(1, "Sub-group ID is required"),

    product: z
      .string({
        error: "Product ID is required",
      })
      .trim()
      .min(1, "Product ID is required"),

    quantity: z
      .number({
        error: "Quantity must be a number",
      })
      .int("Quantity must be a whole number")
      .min(
        1,
        "Quantity must be at least 1"
      ),

    discount: z
      .number({
        error: "Discount must be a number",
      })
      .min(
        0,
        "Discount cannot be negative"
      )
      .optional(),
  });

export const createSaleOrderValidationSchema =
  z.object({
    body: z.object({
      saleOrder: z.object({
        stateOrRegion: z
          .string({
            error:
              "State / Region is required",
          })
          .trim()
          .min(
            1,
            "State / Region is required"
          ),

        customer: z
          .string({
            error:
              "Customer ID is required",
          })
          .trim()
          .min(
            1,
            "Customer ID is required"
          ),

        orderDate: z.union([
          z.string().min(
            1,
            "Order date is required"
          ),
          z.date(),
        ]),

        products: z
          .array(
            orderItemValidationSchema
          )
          .min(
            1,
            "At least one product is required"
          ),

        generalDiscountType: z
          .enum(["%", "flat"])
          .optional(),

        generalDiscountValue: z
          .number({
            error:
              "General discount must be a number",
          })
          .min(
            0,
            "General discount cannot be negative"
          )
          .optional(),

        paidAmount: z
          .number({
            error:
              "Paid amount must be a number",
          })
          .min(
            0,
            "Paid amount cannot be negative"
          ),
      }),
    }),
  });