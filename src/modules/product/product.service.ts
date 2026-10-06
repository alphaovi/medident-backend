import mongoose from "mongoose";
import { ProductDetails } from "./product.interface.js";
import { ProductModel } from "./product.model.js";
import { InventoryModel } from "../inventory/inventory.model.js";

const createProductIntoDB = async (payload: ProductDetails) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const createdProduct = await ProductModel.create([payload], { session });
    const product = createdProduct[0];

    // প্রোডাক্ট ক্রিয়েট হওয়ার সাথে সাথে ইনভেন্টরিতে ইনিডিয়াল এন্ট্রি তৈরি হবে (সব স্টক ০ থাকবে)
    await InventoryModel.create(
      [
        {
          product: product._id,
          group: product.group,
          subGroup: product.subGroup,
          totalStock: 0,
          currentStock: 0,
          onTransit: 0,
          totalSell: 0,
          damaged: 0,
          lost: 0,
          freeSample: 0,
          avgBuyingPrice: product.purchasePrice,
          totalStockValue: 0,
          totalSaleValue: 0,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    const result = await ProductModel.findById(product._id)
      .populate("group")
      .populate("subGroup");

    return result;
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

const getAllProductsFromDB = async () => {
  return await ProductModel.find().populate("group").populate("subGroup");
};

const getSingleProductFromDB = async (id: string) => {
  return await ProductModel.findOne({ id }).populate("group").populate("subGroup");
};

const updateProductInDB = async (id: string, payload: Partial<ProductDetails>) => {
  return await ProductModel.findOneAndUpdate({ id }, payload, {
    new: true,
    runValidators: true,
  })
    .populate("group")
    .populate("subGroup");
};

const deleteProductFromDB = async (id: string) => {
  return await ProductModel.findOneAndDelete({ id });
};

export const ProductServices = {
  createProductIntoDB,
  getAllProductsFromDB,
  getSingleProductFromDB,
  updateProductInDB,
  deleteProductFromDB,
};