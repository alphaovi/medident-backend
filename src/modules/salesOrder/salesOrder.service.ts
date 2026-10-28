// src/app/modules/salesOrder/salesOrder.service.ts

import mongoose from "mongoose";
import { ProductModel } from "../product/product.model.js";
import { CustomerModel } from "../customers/customer.model.js";
import { SaleOrderModel } from "./salesOrder.model.js";
import { InventoryModel } from "../inventory/inventory.model.js";
import { OrderStatus } from "./salesOrder.interface.js";

const roundNumber = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

const createSaleOrderIntoDB = async (payload: any) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const customerQuery = mongoose.Types.ObjectId.isValid(payload.customer)
      ? { $or: [{ id: payload.customer }, { _id: payload.customer }] }
      : { id: payload.customer };

    const customer = await CustomerModel.findOne(customerQuery).session(session);
    if (!customer) throw new Error(`Customer not found: ${payload.customer}`);

    let productsSubtotal = 0;
    const calculatedProducts = [];

    for (const item of payload.products) {
      const productQuery = mongoose.Types.ObjectId.isValid(item.product)
        ? { $or: [{ id: item.product }, { _id: item.product }] }
        : { id: item.product };

      const product = await ProductModel.findOne(productQuery).session(session);
      if (!product) throw new Error(`Product not found: ${item.product}`);

      const inventory = await InventoryModel.findOne({ product: product._id }).session(session);
      if (!inventory) throw new Error(`Inventory record not found for product: ${product.name}`);

      if (inventory.currentStock < item.quantity) {
        throw new Error(`Insufficient stock for ${product.name}. Available: ${inventory.currentStock}`);
      }

      const price = product.sellingPrice;
      const totalPrice = roundNumber(price * item.quantity);
      const itemDiscount = roundNumber(Number(item.discount) || 0);
      const afterDiscount = roundNumber(Math.max(0, totalPrice - itemDiscount));

      productsSubtotal = roundNumber(productsSubtotal + afterDiscount);

      calculatedProducts.push({
        group: product.group,
        subGroup: product.subGroup,
        product: product._id,
        quantity: item.quantity,
        price,
        discount: itemDiscount,
        totalPrice,
        afterDiscount,
      });
    }

    let grandTotal = productsSubtotal;
    if (payload.generalDiscountType && payload.generalDiscountValue) {
      if (payload.generalDiscountType === "%") {
        grandTotal = roundNumber(grandTotal - (grandTotal * payload.generalDiscountValue) / 100);
      } else if (payload.generalDiscountType === "flat") {
        grandTotal = roundNumber(grandTotal - payload.generalDiscountValue);
      }
    }

    const dueAmount = roundNumber(grandTotal - payload.paidAmount);

    const createdOrder = await SaleOrderModel.create(
      [{ ...payload, customer: customer._id, products: calculatedProducts, grandTotal, dueAmount, status: payload.status || "pending" }],
      { session }
    );

    for (const item of calculatedProducts) {
      const inventory = await InventoryModel.findOne({ product: item.product }).session(session);
      if (inventory) {
        const updatedCurrentStock = inventory.currentStock - item.quantity;
        const updatedTotalSell = (inventory.totalSell || 0) + item.quantity;
        const updatedTotalStock = Math.max(0, inventory.totalStock - item.quantity);

        await InventoryModel.findOneAndUpdate(
          { product: item.product },
          {
            $set: {
              currentStock: updatedCurrentStock,
              totalStock: updatedTotalStock,
              totalSell: updatedTotalSell,
              totalStockValue: Number((updatedCurrentStock * inventory.avgBuyingPrice).toFixed(2)),
              totalSaleValue: Number(((inventory.totalSaleValue || 0) + item.afterDiscount).toFixed(2)),
            },
          },
          { session }
        );
      }
    }

    await session.commitTransaction();
    return createdOrder[0];
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};

const updateSaleOrderIntoDB = async (id: string, payload: any) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const existingOrder = await SaleOrderModel.findById(id).session(session);
    if (!existingOrder) throw new Error("Sale order not found");

    // 1. Resolve Customer safely
    const customerQuery = mongoose.Types.ObjectId.isValid(payload.customer)
      ? { $or: [{ id: payload.customer }, { _id: payload.customer }] }
      : { id: payload.customer };

    const customer = await CustomerModel.findOne(customerQuery).session(session);
    if (!customer) throw new Error(`Customer not found: ${payload.customer}`);

    // 2. Restore old inventory stock safely
    for (const item of existingOrder.products) {
      const inventory = await InventoryModel.findOne({ product: item.product }).session(session);
      if (inventory) {
        inventory.currentStock += item.quantity;
        inventory.totalStock += item.quantity;
        inventory.totalSell = Math.max(0, (inventory.totalSell || 0) - item.quantity);
        await inventory.save({ session });
      }
    }

    let productsSubtotal = 0;
    const calculatedProducts = [];

    // 3. Process new products and check available stock
    for (const item of payload.products) {
      const productQuery = mongoose.Types.ObjectId.isValid(item.product)
        ? { $or: [{ id: item.product }, { _id: item.product }] }
        : { id: item.product };

      const product = await ProductModel.findOne(productQuery).session(session);
      if (!product) throw new Error(`Product not found: ${item.product}`);

      const inventory = await InventoryModel.findOne({ product: product._id }).session(session);
      if (!inventory) throw new Error(`Inventory record not found for product: ${product.name}`);

      if (inventory.currentStock < item.quantity) {
        throw new Error(`Insufficient stock for ${product.name}. Available: ${inventory.currentStock}`);
      }

      const price = product.sellingPrice;
      const totalPrice = roundNumber(price * item.quantity);
      const itemDiscount = roundNumber(Number(item.discount) || 0);
      const afterDiscount = roundNumber(Math.max(0, totalPrice - itemDiscount));

      productsSubtotal = roundNumber(productsSubtotal + afterDiscount);

      calculatedProducts.push({
        group: product.group,
        subGroup: product.subGroup,
        product: product._id,
        quantity: item.quantity,
        price,
        discount: itemDiscount,
        totalPrice,
        afterDiscount,
      });
    }

    let grandTotal = productsSubtotal;
    if (payload.generalDiscountType && payload.generalDiscountValue) {
      if (payload.generalDiscountType === "%") {
        grandTotal = roundNumber(grandTotal - (grandTotal * payload.generalDiscountValue) / 100);
      } else if (payload.generalDiscountType === "flat") {
        grandTotal = roundNumber(grandTotal - payload.generalDiscountValue);
      }
    }

    const dueAmount = roundNumber(grandTotal - payload.paidAmount);

    // 4. Deduct new inventory stock safely
    for (const item of calculatedProducts) {
      const inventory = await InventoryModel.findOne({ product: item.product }).session(session);
      if (inventory) {
        const updatedCurrentStock = inventory.currentStock - item.quantity;
        const updatedTotalSell = (inventory.totalSell || 0) + item.quantity;
        const updatedTotalStock = Math.max(0, inventory.totalStock - item.quantity);

        await InventoryModel.findOneAndUpdate(
          { product: item.product },
          {
            $set: {
              currentStock: updatedCurrentStock,
              totalStock: updatedTotalStock,
              totalSell: updatedTotalSell,
              totalStockValue: Number((updatedCurrentStock * inventory.avgBuyingPrice).toFixed(2)),
              totalSaleValue: Number(((inventory.totalSaleValue || 0) + item.afterDiscount).toFixed(2)),
            },
          },
          { session }
        );
      }
    }

    const updatedOrder = await SaleOrderModel.findByIdAndUpdate(
      id,
      {
        ...payload,
        customer: customer._id,
        products: calculatedProducts,
        grandTotal,
        dueAmount,
      },
      { new: true, session }
    );

    await session.commitTransaction();
    return updatedOrder;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};

const getAllSaleOrdersFromDB = async () => {
  return await SaleOrderModel.find()
    .populate("customer")
    .populate("products.product")
    .populate("products.group")
    .populate("products.subGroup");
};

const getSaleOrderByIdFromDB = async (id: string) => {
  return await SaleOrderModel.findById(id)
    .populate("customer")
    .populate("products.product")
    .populate("products.group")
    .populate("products.subGroup");
};

const updateSaleOrderStatusIntoDB = async (id: string, newStatus: OrderStatus) => {
  const order = await SaleOrderModel.findById(id);
  if (!order) throw new Error("Sale order not found");

  order.status = newStatus;
  return await order.save();
};

const deleteSaleOrderFromDB = async (id: string) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const order = await SaleOrderModel.findById(id).session(session);
    if (!order) throw new Error("Sale order not found");

    for (const item of order.products) {
      const inventory = await InventoryModel.findOne({ product: item.product }).session(session);
      if (inventory) {
        inventory.currentStock += item.quantity;
        inventory.totalStock += item.quantity;
        inventory.totalSell = Math.max(0, (inventory.totalSell || 0) - item.quantity);
        await inventory.save({ session });
      }
    }

    const deletedOrder = await SaleOrderModel.findByIdAndDelete(id).session(session);

    await session.commitTransaction();
    return deletedOrder;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};

export const SaleOrderServices = {
  createSaleOrderIntoDB,
  updateSaleOrderIntoDB,
  getAllSaleOrdersFromDB,
  getSaleOrderByIdFromDB,
  updateSaleOrderStatusIntoDB,
  deleteSaleOrderFromDB,
};