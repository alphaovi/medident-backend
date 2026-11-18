// product.service.ts
import { ProductDetails } from "./product.interface.js";
import { ProductModel } from "./product.model.js";

const createProductIntoDB = async (payload: ProductDetails) => {
  const result = await ProductModel.create(payload);
  return result;
};

const getAllProductsFromDB = async () => {
  try {
    // 🟢 Safe populate handle kora holo jate kono mismatch holeo 500 error na ase
    const result = await ProductModel.find()
      .populate({ path: "group", strictPopulate: false })
      .populate({ path: "subGroup", strictPopulate: false });
    return result;
  } catch (error) {
    // Fallback: populate chara data return korbe jate server crash na kore
    return await ProductModel.find();
  }
};

const getSingleProductFromDB = async (id: string) => {
  const query = id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { id: id };
  try {
    const result = await ProductModel.findOne(query)
      .populate({ path: "group", strictPopulate: false })
      .populate({ path: "subGroup", strictPopulate: false });
    return result;
  } catch (error) {
    return await ProductModel.findOne(query);
  }
};

const updateProductInDB = async (id: string, payload: Partial<ProductDetails>) => {
  const query = id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { id: id };
  const result = await ProductModel.findOneAndUpdate(query, payload, {
    new: true,
    runValidators: true,
  });
  return result;
};

const deleteProductFromDB = async (id: string) => {
  const query = id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { id: id };
  const result = await ProductModel.findOneAndDelete(query);
  return result;
};

export const ProductServices = {
  createProductIntoDB,
  getAllProductsFromDB,
  getSingleProductFromDB,
  updateProductInDB,
  deleteProductFromDB,
};