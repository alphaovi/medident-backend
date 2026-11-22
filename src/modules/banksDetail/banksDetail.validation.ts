import { z } from "zod";

export const createBankDetailValidationSchema = z.object({
  body: z
    .object({
      bankName: z.string({ required_error: "Bank name is required" }).min(1, "Bank name is required"),
      accountNo: z.string().optional(),
      accountName: z.string({ required_error: "Account name is required" }).min(1, "Account name is required"),
      branch: z.string().optional(),
      details: z.string().optional(),
      isActive: z.boolean().optional(),
      currentBalance: z.number().optional(),
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
    bankName: z.string().min(1).optional(),
    accountNo: z.string().optional(),
    accountName: z.string().min(1).optional(),
    branch: z.string().optional(),
    details: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const transferBalanceValidationSchema = z.object({
  body: z.object({
    fromBankId: z.string({ required_error: "From bank account ID is required" }).min(1),
    toBankId: z.string({ required_error: "To bank account ID is required" }).min(1),
    amount: z.number({ required_error: "Amount is required" }).positive("Transfer amount must be greater than 0"),
    date: z.string().optional(),
    note: z.string().optional(),
  }),
});