import { InventoryModel } from "./inventory.model.js";

const getAllInventoriesFromDB = async () => {
  return await InventoryModel.find()
    .populate("product")
    .populate("group")
    .populate("subGroup");
};

const getSingleInventoryFromDB = async (id: string) => {
  let inventory = null;
  if (id.match(/^[0-9a-fA-F]{24}$/)) {
    inventory = await InventoryModel.findById(id)
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

const updateInventoryInDB = async (id: string, payload: any) => {
  let inventory = null;

  // 1. Try finding by Inventory ID or Product ID
  if (id.match(/^[0-9a-fA-F]{24}$/)) {
    inventory = await InventoryModel.findById(id);
  }

  if (!inventory) {
    inventory = await InventoryModel.findOne({ product: id });
  }

  // If purchase order passes specific item additions for average calculation
  if (payload.incomingQty !== undefined && payload.incomingUnitCost !== undefined) {
    const currentStock = inventory?.currentStock || 0;
    const oldAvgPrice = inventory?.avgBuyingPrice || 0;
    const incomingQty = Number(payload.incomingQty) || 0;
    const incomingUnitCost = Number(payload.incomingUnitCost) || 0;

    let calculatedAvgPrice = incomingUnitCost;

    if (currentStock > 0 && (currentStock + incomingQty) > 0) {
      const totalOldValue = currentStock * oldAvgPrice;
      const totalNewBatchValue = incomingQty * incomingUnitCost;
      calculatedAvgPrice = (totalOldValue + totalNewBatchValue) / (currentStock + incomingQty);
    }

    payload.avgBuyingPrice = Number(calculatedAvgPrice.toFixed(2));
    delete payload.incomingQty;
    delete payload.incomingUnitCost;
  }

  // Perform Update
  if (inventory) {
    return await InventoryModel.findByIdAndUpdate(
      inventory._id,
      { $set: payload },
      { new: true, runValidators: true }
    )
      .populate("product")
      .populate("group")
      .populate("subGroup");
  } else {
    // If inventory doesn't exist yet, upsert by product ID
    return await InventoryModel.findOneAndUpdate(
      { product: id },
      { $set: payload },
      { new: true, upsert: true, runValidators: true }
    )
      .populate("product")
      .populate("group")
      .populate("subGroup");
  }
};

export const InventoryServices = {
  getAllInventoriesFromDB,
  getSingleInventoryFromDB,
  updateInventoryInDB,
};