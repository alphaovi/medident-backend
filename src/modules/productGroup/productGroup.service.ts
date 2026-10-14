import { ProductGroup } from "./productGroup.interface.js";
import { ProductGroupModel } from "./productGroup.model.js";

const createProductGroupIntoDB = async (productGroup: ProductGroup) => {
  if (!productGroup.id) {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 7);
    productGroup.id = `grp-${timestamp}-${randomStr}`;
  }

  const result = await ProductGroupModel.create(productGroup);
  return result;
};

const getAllProductGroupsFromDB = async () => {
  const result = await ProductGroupModel.find();
  return result;
};

const getSingleProductGroupFromDB = async (id: string) => {
  const result = await ProductGroupModel.findOne({ id });
  return result;
};

// --- UPDATE SERVICE (PATCH) ---
const updateProductGroupInDB = async (
  id: string,
  payload: Partial<ProductGroup>
) => {
  const result = await ProductGroupModel.findOneAndUpdate(
    { id },
    { $set: payload },
    { new: true, runValidators: true }
  );
  return result;
};

const deleteSingleProductGroupFromDB = async (id: string) => {
  const result = await ProductGroupModel.findOneAndDelete({ id });
  return result;
};

export const ProductGroupServices = {
  createProductGroupIntoDB,
  getAllProductGroupsFromDB,
  getSingleProductGroupFromDB,
  updateProductGroupInDB,
  deleteSingleProductGroupFromDB,
};