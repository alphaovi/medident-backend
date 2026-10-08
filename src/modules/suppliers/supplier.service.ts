import { SupplierModel } from "./supplier.model.js";
import { Suppliers } from "./suppliers.interface.js";

const createSupplierIntoDB = async (payload: Suppliers) => {
  const existingSupplier = await SupplierModel.findOne({
    $or: [
      { supplierId: payload.supplierId },
      { supplierName: payload.supplierName },
      { supplierPhoneNo: payload.supplierPhoneNo },
    ],
  });

  if (existingSupplier) {
    throw new Error("Supplier already exists");
  }

  const result = await SupplierModel.create(payload);
  return result;
};

const getAllSuppliersFromDB = async () => {
  const result = await SupplierModel.find().sort({ createdAt: -1 });
  return result;
};

const getSingleSupplierFromDB = async (supplierId: string) => {
  const result = await SupplierModel.findOne({ supplierId });

  if (!result) {
    throw new Error("Supplier not found");
  }

  return result;
};

const updateSupplierIntoDB = async (
  supplierId: string,
  payload: Partial<Suppliers>
) => {
  const result = await SupplierModel.findOneAndUpdate({ supplierId }, payload, {
    new: true,
    runValidators: true,
  });

  if (!result) {
    throw new Error("Supplier not found");
  }

  return result;
};

const deleteSupplierFromDB = async (supplierId: string) => {
  const result = await SupplierModel.findOneAndDelete({ supplierId });

  if (!result) {
    throw new Error("Supplier not found");
  }

  return result;
};

export const SupplierServices = {
  createSupplierIntoDB,
  getAllSuppliersFromDB,
  getSingleSupplierFromDB,
  updateSupplierIntoDB,
  deleteSupplierFromDB,
};