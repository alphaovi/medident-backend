import { ProductSubgroup } from "./productSubgroup.interface.js";
import { ProductSubgroupModel } from "./productSubgroup.model.js";

const createProductSubgroupIntoDB = async (
  productSubgroup: ProductSubgroup
) => {
  const result =
    await ProductSubgroupModel.create(productSubgroup);

  return result;
};

const getAllProductSubgroupsFromDB = async (
  group?: string
) => {
  const filter = group ? { group } : {};

  const result = await ProductSubgroupModel.find(filter).populate(
    "group"
  );

  return result;
};

const getSingleProductSubgroupFromDB = async (id: string) => {
  const result = await ProductSubgroupModel
    .findOne({ id })
    .populate("group");

  return result;
};

const updateProductSubgroupIntoDB = async (
  id: string,
  productSubgroup: Partial<ProductSubgroup>
) => {
  const result = await ProductSubgroupModel.findOneAndUpdate(
    { id },
    productSubgroup,
    {
      new: true,
      runValidators: true,
    }
  ).populate("group");

  return result;
};

const deleteSingleProductSubgroupFromDB = async (
  id: string
) => {
  const result =
    await ProductSubgroupModel.findOneAndDelete({ id });

  return result;
};

export const ProductSubgroupServices = {
  createProductSubgroupIntoDB,
  getAllProductSubgroupsFromDB,
  getSingleProductSubgroupFromDB,
  updateProductSubgroupIntoDB,
  deleteSingleProductSubgroupFromDB,
};