import { z } from "zod";

const createSupplierValidationSchema = z.object({
  body: z.object({
    supplier: z.object({
      supplierId: z.string().min(1, "Supplier ID is required"),
      supplierName: z.string().min(1, "Supplier name is required"),
      supplierPhoneNo: z.string().min(1, "Supplier phone number is required"),
      supplierAddress: z.string().min(1, "Supplier address is required"),
      isActive: z.boolean().optional().default(true),
    }),
  }),
});

const updateSupplierValidationSchema = z.object({
  body: z.object({
    supplierName: z.string().optional(),
    supplierPhoneNo: z.string().optional(),
    supplierAddress: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const SupplierValidations = {
  createSupplierValidationSchema,
  updateSupplierValidationSchema,
};