import mongoose from "mongoose";
import { ProductSubgroup } from "./productSubgroup.interface.js";
import { ProductSubgroupModel } from "./productSubgroup.model.js";

// 🟢 সেফ রেজিস্টার: যদি মডেল অলরেডি রেজিস্টার্ড না থাকে তবে ProductSubGroup নামে রেজিস্টার করে নিবে
const ActiveSubgroupModel = mongoose.models.ProductSubGroup || mongoose.model("ProductSubGroup", ProductSubgroupModel.schema);

const createProductSubgroupIntoDB = async (
  productSubgroup: ProductSubgroup
) => {
  const result = await ActiveSubgroupModel.create(productSubgroup);
  return result;
};

const getAllProductSubgroupsFromDB = async (
  group?: string
) => {
  const filter = group ? { group } : {};
  const result = await ActiveSubgroupModel.find(filter).populate("group");
  return result;
};

const getSingleProductSubgroupFromDB = async (id: string) => {
  const result = await ActiveSubgroupModel.findOne({ id }).populate("group");
  return result;
};

const updateProductSubgroupIntoDB = async (id: string, payload: Partial<ProductSubgroup>) => {
  const result = await ActiveSubgroupModel.findOneAndUpdate({ id }, payload, {
    new: true,
    runValidators: true,
  });
  return result;
};

const deleteProductSubgroupFromDB = async (id: string) => {
  const result = await ActiveSubgroupModel.findOneAndDelete({ id });
  return result;
};

export const ProductSubgroupServices = {
  createProductSubgroupIntoDB,
  getAllProductSubgroupsFromDB,
  getSingleProductSubgroupFromDB,
  updateProductSubgroupIntoDB,
  deleteProductSubgroupFromDB,
};