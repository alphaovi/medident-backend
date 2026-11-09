import mongoose from "mongoose";
import { StockAdjustmentModel } from "./stockAdjustment.model.js";
import { InventoryModel } from "../inventory/inventory.model.js";
import { ProductModel } from "../product/product.model.js";
import { CustomerModel } from "../customers/customer.model.js";

const createStockAdjustmentIntoDB = async (payload: any) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const product = await ProductModel.findOne({ id: payload.product }).session(session);
    if (!product) throw new Error(`Product not found: ${payload.product}`);

    let customerId = undefined;
    if (payload.adjustmentType === "Free Sample" && payload.customer) {
      const customer = await CustomerModel.findOne({
        $or: [{ id: payload.customer }, { _id: mongoose.Types.ObjectId.isValid(payload.customer) ? payload.customer : null }]
      }).session(session);
      if (customer) customerId = customer._id;
    }

    const inventory = await InventoryModel.findOne({ product: product._id }).session(session);
    if (!inventory) throw new Error(`Inventory record not found for product: ${product.name}`);

    if (inventory.currentStock < payload.quantity) {
      throw new Error(`Insufficient stock for ${product.name}. Available current stock: ${inventory.currentStock}`);
    }

    let damagedQty = inventory.damaged || 0;
    let lostQty = inventory.lost || 0;
    let freeSampleQty = inventory.freeSample || 0;

    const type = payload.adjustmentType;
    if (type === "Damaged" || type === "Damage") {
      damagedQty += payload.quantity;
    } else if (type === "Lost") {
      lostQty += payload.quantity;
    } else if (type === "Free Sample") {
      freeSampleQty += payload.quantity;
    }

    const updatedCurrentStock = Math.max(
      0,
      inventory.totalStock - (inventory.totalSell || 0) - damagedQty - lostQty - freeSampleQty - (inventory.purchaseReturn || 0) + (inventory.sellReturn || 0)
    );

    const updateFields = {
      damaged: damagedQty,
      lost: lostQty,
      freeSample: freeSampleQty,
      currentStock: updatedCurrentStock,
      totalStockValue: Number((updatedCurrentStock * inventory.avgBuyingPrice).toFixed(2)),
    };

    await InventoryModel.findOneAndUpdate(
      { product: product._id },
      { $set: updateFields },
      { session }
    );

    const result = await StockAdjustmentModel.create(
      [{
        ...payload,
        adjustmentType: type === "Damage" ? "Damaged" : type,
        product: product._id,
        customer: customerId,
      }],
      { session }
    );

    await session.commitTransaction();
    return result[0];
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};

const updateStockAdjustmentIntoDB = async (id: string, payload: any) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const existingAdjustment = await StockAdjustmentModel.findById(id).session(session);
    if (!existingAdjustment) throw new Error("Stock adjustment record not found");

    const newProduct = await ProductModel.findOne({ id: payload.product }).session(session);
    if (!newProduct) throw new Error(`Product not found: ${payload.product}`);

    let customerId = undefined;
    if (payload.adjustmentType === "Free Sample" && payload.customer) {
      const customer = await CustomerModel.findOne({
        $or: [{ id: payload.customer }, { _id: mongoose.Types.ObjectId.isValid(payload.customer) ? payload.customer : null }]
      }).session(session);
      if (customer) customerId = customer._id;
    }

    const oldProductInventory = await InventoryModel.findOne({ product: existingAdjustment.product }).session(session);
    if (oldProductInventory) {
      let oldDamaged = oldProductInventory.damaged || 0;
      let oldLost = oldProductInventory.lost || 0;
      let oldFreeSample = oldProductInventory.freeSample || 0;

      if (existingAdjustment.adjustmentType === "Damaged") oldDamaged = Math.max(0, oldDamaged - existingAdjustment.quantity);
      else if (existingAdjustment.adjustmentType === "Lost") oldLost = Math.max(0, oldLost - existingAdjustment.quantity);
      else if (existingAdjustment.adjustmentType === "Free Sample") oldFreeSample = Math.max(0, oldFreeSample - existingAdjustment.quantity);

      const revertedCurrentStock = Math.max(
        0,
        oldProductInventory.totalStock - (oldProductInventory.totalSell || 0) - oldDamaged - oldLost - oldFreeSample - (oldProductInventory.purchaseReturn || 0) + (oldProductInventory.sellReturn || 0)
      );

      await InventoryModel.findOneAndUpdate(
        { product: existingAdjustment.product },
        {
          $set: {
            damaged: oldDamaged,
            lost: oldLost,
            freeSample: oldFreeSample,
            currentStock: revertedCurrentStock,
            totalStockValue: Number((revertedCurrentStock * oldProductInventory.avgBuyingPrice).toFixed(2)),
          },
        },
        { session }
      );
    }

    const newProductInventory = await InventoryModel.findOne({ product: newProduct._id }).session(session);
    if (!newProductInventory) throw new Error(`Inventory record not found for product: ${newProduct.name}`);

    let curDamaged = newProductInventory.damaged || 0;
    let curLost = newProductInventory.lost || 0;
    let curFreeSample = newProductInventory.freeSample || 0;

    const type = payload.adjustmentType;
    if (type === "Damaged" || type === "Damage") curDamaged += payload.quantity;
    else if (type === "Lost") curLost += payload.quantity;
    else if (type === "Free Sample") curFreeSample += payload.quantity;

    const updatedCurrentStock = Math.max(
      0,
      newProductInventory.totalStock - (newProductInventory.totalSell || 0) - curDamaged - curLost - curFreeSample - (newProductInventory.purchaseReturn || 0) + (newProductInventory.sellReturn || 0)
    );

    if (updatedCurrentStock < 0) {
      throw new Error(`Insufficient stock for update. Available current stock limit exceeded.`);
    }

    await InventoryModel.findOneAndUpdate(
      { product: newProduct._id },
      {
        $set: {
          damaged: curDamaged,
          lost: curLost,
          freeSample: curFreeSample,
          currentStock: updatedCurrentStock,
          totalStockValue: Number((updatedCurrentStock * newProductInventory.avgBuyingPrice).toFixed(2)),
        },
      },
      { session }
    );

    const updatedRecord = await StockAdjustmentModel.findByIdAndUpdate(
      id,
      {
        ...payload,
        adjustmentType: type === "Damage" ? "Damaged" : type,
        product: newProduct._id,
        customer: customerId,
      },
      { new: true, session }
    )
      .populate("product")
      .populate("customer");

    await session.commitTransaction();
    return updatedRecord;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};

const getAllStockAdjustmentsFromDB = async () => {
  return await StockAdjustmentModel.find()
    .populate("product")
    .populate("customer");
};

export const StockAdjustmentServices = {
  createStockAdjustmentIntoDB,
  updateStockAdjustmentIntoDB,
  getAllStockAdjustmentsFromDB,
};