import { ProductSubgroupModel } from "../productSubgroup/productSubgroup.model.js";
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

// --- DELETE SERVICE WITH CASCADING SUBGROUP DELETION ---
const deleteSingleProductGroupFromDB = async (id: string) => {
  // ১. গ্রুপটি ডাটাবেজে আছে কিনা তা খুঁজে বের করা
  const group = await ProductGroupModel.findOne({ id });
  
  if (!group) {
    throw new Error("Product group not found!");
  }

  // ২. এই গ্রুপের আন্ডারে থাকা সমস্ত সাবগ্রুপ ব্যাকএন্ড থেকে স্বয়ংক্রিয়ভাবে ডিলিট করা
  await ProductSubgroupModel.deleteMany({
    $or: [
      { group: group._id },
      { group: group.id }
    ]
  });

  // ৩. সাবগ্রুপগুলো মুছে যাওয়ার পর মূল গ্রুপটি ডিলিট করা
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