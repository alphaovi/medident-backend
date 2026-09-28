import { ProductGroup } from "./productGroup.interface.js";
import { ProductGroupModel } from "./productGroup.model.js";

const createProductGroupIntoDB = async (
  productGroup: ProductGroup
) => {
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

const deleteSingleProductGroupFromDB = async (id: string) => {
  const result = await ProductGroupModel.findOneAndDelete({ id });

  return result;
};

export const ProductGroupServices = {
  createProductGroupIntoDB,
  getAllProductGroupsFromDB,
  getSingleProductGroupFromDB,
  deleteSingleProductGroupFromDB,
};