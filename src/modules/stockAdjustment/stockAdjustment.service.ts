import mongoose from "mongoose";
import { StockAdjustmentModel } from "./stockAdjustment.model.js";
import { InventoryModel } from "../inventory/inventory.model.js";
import { ProductModel } from "../product/product.model.js";

const createStockAdjustmentIntoDB = async (payload: any) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const product = await ProductModel.findOne({ id: payload.product }).session(session);
    if (!product) throw new Error(`Product not found: ${payload.product}`);

    const inventory = await InventoryModel.findOne({ product: product._id }).session(session);
    if (!inventory) throw new Error(`Inventory record not found for product: ${product.name}`);

    if (inventory.currentStock < payload.quantity) {
      throw new Error(`Insufficient stock for ${product.name}. Available current stock: ${inventory.currentStock}`);
    }

    const updatedCurrentStock = inventory.currentStock - payload.quantity;
    const updatedTotalStock = Math.max(0, inventory.totalStock - payload.quantity);

    let updateFields: any = {
      currentStock: updatedCurrentStock,
      totalStock: updatedTotalStock,
      totalStockValue: Number((updatedCurrentStock * inventory.avgBuyingPrice).toFixed(2)),
    };

    if (payload.adjustmentType === "Damaged") {
      updateFields.damaged = (inventory.damaged || 0) + payload.quantity;
    } else if (payload.adjustmentType === "Lost") {
      updateFields.lost = (inventory.lost || 0) + payload.quantity;
    } else if (payload.adjustmentType === "Free Sample") {
      updateFields.freeSample = (inventory.freeSample || 0) + payload.quantity;
    }

    await InventoryModel.findOneAndUpdate(
      { product: product._id },
      { $set: updateFields },
      { session }
    );

    const result = await StockAdjustmentModel.create(
      [{
        ...payload,
        product: product._id,
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

const getAllStockAdjustmentsFromDB = async () => {
  return await StockAdjustmentModel.find().populate("product");
};

export const StockAdjustmentServices = {
  createStockAdjustmentIntoDB,
  getAllStockAdjustmentsFromDB,
};