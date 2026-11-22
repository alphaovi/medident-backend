import mongoose from "mongoose";
import { ProductSubgroup } from "./productSubgroup.interface.js";
import { ProductSubgroupModel } from "./productSubgroup.model.js";

// 🟢 সেফ রেজিস্টার: যদি মডেল অলরেডি রেজিস্টার্ড না থাকে তবে ProductSubGroup নামে রেজিস্টার করে নিবে
const ActiveSubgroupModel = mongoose.models.ProductSubGroup || mongoose.model("ProductSubGroup", ProductSubgroupModel.schema);

const createProductSubgroupIntoDB = async (
  productSubgroup: ProductSubgroup
) => {
  if (!productSubgroup.id) {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 7);
    productSubgroup.id = `sub-${timestamp}-${randomStr}`;
  }
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
  const query = mongoose.Types.ObjectId.isValid(id)
    ? { $or: [{ id }, { _id: id }] }
    : { id };
  const result = await ActiveSubgroupModel.findOne(query).populate("group");
  return result;
};

const updateProductSubgroupIntoDB = async (id: string, payload: Partial<ProductSubgroup>) => {
  const query = mongoose.Types.ObjectId.isValid(id)
    ? { $or: [{ id }, { _id: id }] }
    : { id };
  const result = await ActiveSubgroupModel.findOneAndUpdate(query, payload, {
    new: true,
    runValidators: true,
  });
  return result;
};

// 🟢 ফাংশন নেম কন্ট্রোলারের সাথে ম্যাচ করানো হলো এবং কাস্টম আইডি (sub-xxxx) অথবা _id উভয়টি সাপোর্ট করবে
const deleteSingleProductSubgroupFromDB = async (id: string) => {
  const query = mongoose.Types.ObjectId.isValid(id)
    ? { $or: [{ id }, { _id: id }] }
    : { id };
    
  const result = await ActiveSubgroupModel.findOneAndDelete(query);
  return result;
};

export const ProductSubgroupServices = {
  createProductSubgroupIntoDB,
  getAllProductSubgroupsFromDB,
  getSingleProductSubgroupFromDB,
  updateProductSubgroupIntoDB,
  deleteSingleProductSubgroupFromDB,
};