import { z } from "zod";

export const createBankDetailValidationSchema = z.object({
  body: z.object({
    bankName: z.string({ required_error: "Bank name is required" }).min(1, "Bank name is required"),
    accountNo: z.string({ required_error: "Account number is required" }).min(1, "Account number is required"),
    accountName: z.string({ required_error: "Account name is required" }).min(1, "Account name is required"),
    branch: z.string().optional(),
    details: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const updateBankDetailValidationSchema = z.object({
  body: z.object({
    bankName: z.string().min(1).optional(),
    accountNo: z.string().min(1).optional(),
    accountName: z.string().min(1).optional(),
    branch: z.string().optional(),
    details: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});