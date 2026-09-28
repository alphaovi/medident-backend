import { z } from "zod";

const divisions = [
  "Barisal",
  "Chattogram",
  "Dhaka",
  "Khulna",
  "Mymensingh",
  "Rajshahi",
  "Rangpur",
  "Sylhet",
] as const;

const phoneValidation = z
  .string({
    error: "Phone number is required",
  })
  .trim()
  .transform((value) => {
    if (value.startsWith("+880")) {
      return value.slice(4);
    }

    if (value.startsWith("880")) {
      return value.slice(3);
    }

    if (value.startsWith("0")) {
      return value.slice(1);
    }

    return value;
  })
  .refine(
    (value) => /^1[3-9]\d{8}$/.test(value),
    "Invalid Bangladesh phone number"
  )
  .transform((value) => `+880${value}`);

const objectIdValidation = z
  .string({
    error: "SR is required",
  })
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid SR ObjectId");

export const createCustomerValidationSchema = z.object({
  body: z.object({
    customer: z.object({
      id: z
        .string({
          error: "Customer id is required",
        })
        .trim()
        .min(1, "Customer id cannot be empty"),

      name: z
        .string({
          error: "Customer name is required",
        })
        .trim()
        .min(1, "Customer name cannot be empty"),

      division: z.enum(divisions, {
        error: "Invalid Bangladesh division",
      }),

      address: z
        .string({
          error: "Address is required",
        })
        .trim()
        .min(1, "Address cannot be empty"),

      phone: phoneValidation,

      sr: objectIdValidation,

      status: z.enum(["Active", "Inactive"]).default("Active"),
    }),
  }),
});

export const updateCustomerValidationSchema = z.object({
  body: z.object({
    customer: z
      .object({
        id: z.string().trim().min(1, "Customer id cannot be empty").optional(),

        name: z
          .string()
          .trim()
          .min(1, "Customer name cannot be empty")
          .optional(),

        division: z
          .enum(divisions, {
            error: "Invalid Bangladesh division",
          })
          .optional(),

        address: z.string().trim().min(1, "Address cannot be empty").optional(),

        phone: phoneValidation.optional(),

        sr: objectIdValidation.optional(),

        status: z.enum(["Active", "Inactive"]).optional(),
      })
      .refine(
        (data) =>
          data.id !== undefined ||
          data.name !== undefined ||
          data.division !== undefined ||
          data.address !== undefined ||
          data.phone !== undefined ||
          data.sr !== undefined ||
          data.status !== undefined,
        {
          message: "At least one field is required for update",
        }
      ),
  }),
});

export type CreateCustomerInput = z.infer<
  typeof createCustomerValidationSchema
>;

export type UpdateCustomerInput = z.infer<
  typeof updateCustomerValidationSchema
>;
