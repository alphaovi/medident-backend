import { z } from "zod";

export const createBankDetailValidationSchema = z.object({
  body: z.object({
    user: z.string().optional(),
    bankName: z.string().min(1, "Bank name is required"),
    accountNo: z.string().optional().default(""),
    accountName: z.string().min(1, "Account name is required"),
    branch: z.string().optional().default(""),
    details: z.string().optional().default(""),
    isActive: z.boolean().optional().default(true),
    openingBalance: z.coerce.number().min(0).optional().default(0),
    currentBalance: z.coerce.number().min(0).optional(),
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
    currentBalance: z.coerce.number().optional(),
  }),
});