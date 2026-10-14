import { ProductDetails } from "./product.interface.js";
import { ProductModel } from "./product.model.js";

const createProductIntoDB = async (payload: ProductDetails) => {
  const result = await ProductModel.create(payload);
  return result;
};

const getAllProductsFromDB = async () => {
  const result = await ProductModel.find().populate("group subGroup");
  return result;
};

const getSingleProductFromDB = async (id: string) => {
  // Check korbe id ta MongoDB ObjectId naki custom string (e.g. PROD-5757)
  const query = id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { id: id };
  const result = await ProductModel.findOne(query).populate("group subGroup");
  return result;
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