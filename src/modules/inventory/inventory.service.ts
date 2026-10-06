import { InventoryModel } from "./inventory.model.js";

const getAllInventoriesFromDB = async () => {
  return await InventoryModel.find().populate("product").populate("group").populate("subGroup");
};

const getSingleInventoryFromDB = async (productId: string) => {
  return await InventoryModel.findOne({ product: productId })
    .populate("product")
    .populate("group")
    .populate("subGroup");
};

export const InventoryServices = {
  getAllInventoriesFromDB,
  getSingleInventoryFromDB,
};