import { z } from "zod";

const createSupplierValidationSchema = z.object({
  body: z.object({
    supplier: z.object({
      supplierId: z.string().min(1, "Supplier ID is required"),
      supplierName: z.string().min(1, "Supplier name is required"),
      supplierPhoneNo: z
        .string()
        .min(1, "Supplier phone number is required"),
      supplierAddress: z.string().min(1, "Supplier address is required"),
    }),
  }),
});

export const SupplierValidations = {
  createSupplierValidationSchema,
};