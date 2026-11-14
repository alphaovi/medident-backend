import { ProductGroup } from "./productGroup.interface.js";
import { ProductGroupModel } from "./productGroup.model.js";
import mongoose from "mongoose";

// সেফ মডেল রেজিস্টার (যাতে কম্পাইলেশন বা মডেল ওভাররাইটজনিত ক্র্যাশ না করে)
const ActiveGroupModel = mongoose.models.ProductGroup || mongoose.model("ProductGroup", ProductGroupModel.schema);

const createProductGroupIntoDB = async (payload: any) => {
  const groupData = payload.productGroup || payload;

  if (!groupData.id) {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 7);
    groupData.id = `grp-${timestamp}-${randomStr}`;
  }

  // যদি ফ্রন্টএন্ড থেকে name আসে কিন্তু স্কিমায় groupName প্রয়োজন হয়
  if (!groupData.groupName && groupData.name) {
    groupData.groupName = groupData.name;
  }

  const result = await ActiveGroupModel.create(groupData);
  return result;
};

const getAllProductGroupsFromDB = async () => {
  const result = await ActiveGroupModel.find();
  return result;
};

const getSingleProductGroupFromDB = async (id: string) => {
  const query = mongoose.Types.ObjectId.isValid(id)
    ? { $or: [{ id }, { _id: id }] }
    : { id };
  const result = await ActiveGroupModel.findOne(query);
  return result;
};

// --- UPDATE SERVICE (PATCH) ---
const updateProductGroupInDB = async (
  id: string,
  payload: Partial<ProductGroup>
) => {
  const query = mongoose.Types.ObjectId.isValid(id)
    ? { $or: [{ id }, { _id: id }] }
    : { id };

  const result = await ActiveGroupModel.findOneAndUpdate(
    query,
    { $set: payload },
    { new: true, runValidators: true }
  );
  return result;
};

// --- SAFE DELETE SERVICE (Cascading with Dynamic Model to prevent 500 Error) ---
const deleteSingleProductGroupFromDB = async (id: string) => {
  const query = mongoose.Types.ObjectId.isValid(id)
    ? { $or: [{ id }, { _id: id }] }
    : { id };

  const group = await ActiveGroupModel.findOne(query);
  
  if (!group) {
    throw new Error("Product group not found!");
  }

  try {
    // ডায়নামিকালি সাবগ্রুপ মডেল চেক করা যাতে ইমপোর্ট পাথ বা রেজিস্টার নিয়ে সমস্যা না হয়
    const SubgroupModel = mongoose.models.ProductSubGroup || mongoose.model("ProductSubGroup");
    await SubgroupModel.deleteMany({
      $or: [
        { group: group._id },
        { group: group.id }
      ]
    });
  } catch (err) {
    // সাবগ্রুপ ডিলিট করতে গিয়ে কোনো ইস্যু হলেও মূল গ্রুপ ডিলিট যাতে আটকে না যায়
  }

  const result = await ActiveGroupModel.findOneAndDelete(query);
  return result;
};

export const ProductGroupServices = {
  createProductGroupIntoDB,
  getAllProductGroupsFromDB,
  getSingleProductGroupFromDB,
  updateProductGroupInDB,
  deleteSingleProductGroupFromDB,
};