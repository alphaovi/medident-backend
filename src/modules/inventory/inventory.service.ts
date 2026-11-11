import { InventoryModel } from "./inventory.model.js";
import mongoose from "mongoose";

// 1. Get All Inventories (Sorted by latest)
const getAllInventoriesFromDB = async () => {
  return await InventoryModel.find()
    .populate("product")
    .populate("group")
    .populate("subGroup")
    .sort({ createdAt: -1 });
};

// 2. Get Single Inventory
const getSingleInventoryFromDB = async (id: string) => {
  let inventory = null;
  if (id.match(/^[0-9a-fA-F]{24}$/)) {
    inventory = await InventoryModel.findOne({ _id: id })
      .populate("product")
      .populate("group")
      .populate("subGroup");
  }

  if (!inventory) {
    inventory = await InventoryModel.findOne({ product: id })
      .populate("product")
      .populate("group")
      .populate("subGroup");
  }

  return inventory;
};

// 3. Update Inventory (Handles Purchases, Average Price & Adjustments)
const updateInventoryInDB = async (id: string, payload: any) => {
  let inventory = null;

  const rawProdId = payload.product || id;
  const prodObjectId = mongoose.isValidObjectId(rawProdId)
    ? new mongoose.Types.ObjectId(rawProdId)
    : null;

  if (rawProdId.toString().match(/^[0-9a-fA-F]{24}$/)) {
    inventory = await InventoryModel.findById(rawProdId);
  }

  if (!inventory && prodObjectId) {
    inventory = await InventoryModel.findOne({ product: prodObjectId });
  }

  if (!inventory) {
    inventory = new InventoryModel({ product: prodObjectId || rawProdId });
  }

  // 🟢 ১. নতুন পারচেজ বা incomingQty আসলে Average Buying Price এবং totalStock আপডেট হবে
  if (payload.incomingQty !== undefined && payload.incomingUnitCost !== undefined) {
    const currentStock = inventory.currentStock || 0;
    const oldAvgPrice = inventory.avgBuyingPrice || 0;
    const incomingQty = Number(payload.incomingQty) || 0;
    const incomingUnitCost = Number(payload.incomingUnitCost) || 0;

    let calculatedAvgPrice = incomingUnitCost;

    if (currentStock > 0 && (currentStock + incomingQty) > 0) {
      const totalOldValue = currentStock * oldAvgPrice;
      const totalNewBatchValue = incomingQty * incomingUnitCost;
      calculatedAvgPrice = (totalOldValue + totalNewBatchValue) / (currentStock + incomingQty);
    }

    inventory.avgBuyingPrice = Number(calculatedAvgPrice.toFixed(2));
    inventory.totalStock = (inventory.totalStock || 0) + incomingQty;

    delete payload.incomingQty;
    delete payload.incomingUnitCost;
  }

  // 🟢 ২. ট্রানজেকশন ফিল্ডগুলো (Damage, Lost, Sample, Sell ইত্যাদি) সঠিকভাবে যোগ হওয়া
  const additiveFields = [
    "purchaseReturn",
    "sellReturn",
    "totalSell",
    "onTransit",
    "damaged",
    "lost",
    "freeSample",
    "totalStock",
  ];

  additiveFields.forEach((field) => {
    if (payload[field] !== undefined) {
      const addValue = Number(payload[field]) || 0;
      (inventory as any)[field] = (Number((inventory as any)[field]) || 0) + addValue;
    }
  });

  if (payload.group !== undefined) inventory.group = payload.group;
  if (payload.subGroup !== undefined) inventory.subGroup = payload.subGroup;
  if (payload.avgBuyingPrice !== undefined)
    inventory.avgBuyingPrice = Number(payload.avgBuyingPrice) || 0;
  if (payload.totalSaleValue !== undefined)
    inventory.totalSaleValue = Number(payload.totalSaleValue) || 0;

  await inventory.save();

  return await InventoryModel.findById(inventory._id)
    .populate("product")
    .populate("group")
    .populate("subGroup");
};

export const InventoryServices = {
  getAllInventoriesFromDB,
  getSingleInventoryFromDB,
  updateInventoryInDB,
};