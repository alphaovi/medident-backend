// inventory.service.ts
import { InventoryModel } from "./inventory.model.js";

const getAllInventoriesFromDB = async () => {
  return await InventoryModel.find()
    .populate("product")
    .populate("group")
    .populate("subGroup")
    .lean();
};

const getSingleInventoryFromDB = async (id: string) => {
  let inventory = null;
  if (id.match(/^[0-9a-fA-F]{24}$/)) {
    inventory = await InventoryModel.findById(id)
      .populate("product")
      .populate("group")
      .populate("subGroup")
      .lean();
  }

  if (!inventory) {
    inventory = await InventoryModel.findOne({ product: id })
      .populate("product")
      .populate("group")
      .populate("subGroup")
      .lean();
  }

  return inventory;
};

const updateInventoryInDB = async (id: string, payload: any) => {
  let inventory = null;

  if (id.match(/^[0-9a-fA-F]{24}$/)) {
    inventory = await InventoryModel.findById(id);
  }

  if (!inventory) {
    inventory = await InventoryModel.findOne({ product: id });
  }

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

  const updateData: any = {};
  const fields = [
    "totalStock", "purchaseReturn", "sellReturn", "lostDamage", 
    "totalSell", "currentStock", "onTransit", "damaged", "lost", 
    "freeSample", "avgBuyingPrice", "totalStockValue", "totalSaleValue"
  ];

  fields.forEach((field) => {
    if (payload[field] !== undefined) {
      updateData[field] = Number(payload[field]) || 0;
    }
  });

  if (inventory) {
    return await InventoryModel.findByIdAndUpdate(
      inventory._id,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .populate("product")
      .populate("group")
      .populate("subGroup");
  } else {
    return await InventoryModel.findOneAndUpdate(
      { product: id },
      { $set: updateData },
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