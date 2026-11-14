import { ProductGroup } from "./productGroup.interface.js";
import { ProductGroupModel } from "./productGroup.model.js";
import mongoose from "mongoose";

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

// --- SAFE DELETE SERVICE (Cascading with Dynamic Model to prevent 500 Error) ---
const deleteSingleProductGroupFromDB = async (id: string) => {
  const group = await ProductGroupModel.findOne({ id });
  
  if (!group) {
    throw new Error("Product group not found!");
  }

  try {
    // ইমপোর্ট পাথ ক্র্যাশ এড়াতে ডায়নামিকালি সাবগ্রুপ মডেল চেক করা হলো
    const SubgroupModel = mongoose.models.ProductSubgroup || mongoose.model("ProductSubgroup");
    await SubgroupModel.deleteMany({
      $or: [
        { group: group._id },
        { group: group.id }
      ]
    });
  } catch (err) {
    // সাবগ্রুপ ডিলিট করতে গিয়ে কোনো ইস্যু হলেও মূল ডিলিট যাতে আটকে না যায়
  }

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