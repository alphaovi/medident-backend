import { z } from "zod";

const phoneValidation = z
  .string({
    error: "Contact number is required",
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
    error: "Customer ObjectId is required",
  })
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid Customer ObjectId");

const assignCustomerValidation = z.object({
  customer: objectIdValidation,

  customerId: z
    .string({
      error: "Customer id is required",
    })
    .trim()
    .min(1, "Customer id cannot be empty"),
});

export const createEmployeeValidationSchema = z.object({
  body: z.object({
    employee: z.object({
      id: z
        .string({
          error: "Employee id is required",
        })
        .trim()
        .min(1, "Employee id cannot be empty"),

      name: z
        .string({
          error: "Employee name is required",
        })
        .trim()
        .min(1, "Employee name cannot be empty"),

      designation: z
        .string({
          error: "Designation is required",
        })
        .trim()
        .min(1, "Designation cannot be empty"),

      joiningDate: z.coerce.date({
        error: "Valid joining date is required",
      }),

      salary: z
        .number({
          error: "Salary must be a number",
        })
        .min(0, "Salary cannot be negative"),

      contact: phoneValidation,

      status: z.enum(["Active", "Inactive"]).default("Active"),

      assignCustomers: z.array(assignCustomerValidation).default([]),
    }),
  }),
});

export const updateEmployeeValidationSchema = z.object({
  body: z.object({
    employee: z
      .object({
        id: z.string().trim().min(1, "Employee id cannot be empty").optional(),

        name: z
          .string()
          .trim()
          .min(1, "Employee name cannot be empty")
          .optional(),

        designation: z
          .string()
          .trim()
          .min(1, "Designation cannot be empty")
          .optional(),

        joiningDate: z.coerce.date().optional(),

        salary: z.number().min(0, "Salary cannot be negative").optional(),

        contact: phoneValidation.optional(),

        status: z.enum(["Active", "Inactive"]).default("Active"),

        assignCustomers: z.array(assignCustomerValidation).optional(),
      })
      .refine(
        (data) =>
          data.id !== undefined ||
          data.name !== undefined ||
          data.designation !== undefined ||
          data.joiningDate !== undefined ||
          data.salary !== undefined ||
          data.contact !== undefined ||
          data.status !== undefined ||
          data.assignCustomers !== undefined,
        {
          message: "At least one field is required for update",
        }
      ),
  }),
});

export type CreateEmployeeInput = z.infer<
  typeof createEmployeeValidationSchema
>;

export type UpdateEmployeeInput = z.infer<
  typeof updateEmployeeValidationSchema
>;
