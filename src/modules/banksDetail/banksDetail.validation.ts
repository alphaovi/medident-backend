import { z } from "zod";

export const createBankDetailValidationSchema = z.object({
  body: z
    .object({
      user: z.string().optional(),
      bankName: z.string({ required_error: "Bank name is required" }).min(1, "Bank name is required"),
      accountNo: z.string().optional(),
      accountName: z.string({ required_error: "Account name is required" }).min(1, "Account name is required"),
      branch: z.string().optional(),
      details: z.string().optional(),
      isActive: z.boolean().optional(),
    })
    .superRefine((data, ctx) => {
      const isCash = data.bankName.trim().toLowerCase() === "cash";
      if (!isCash && (!data.accountNo || data.accountNo.trim().length === 0)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Account number is required for non-cash accounts",
          path: ["accountNo"],
        });
      }
    }),
});

export const updateBankDetailValidationSchema = z.object({
  body: z.object({
    user: z.string().optional(),
    bankName: z.string().min(1).optional(),
    accountNo: z.string().optional(),
    accountName: z.string().min(1).optional(),
    branch: z.string().optional(),
    details: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});