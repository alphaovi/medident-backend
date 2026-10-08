import mongoose from "mongoose";
import { ProductModel } from "../product/product.model.js";
import { CustomerModel } from "../customers/customer.model.js";
import { SaleOrderModel } from "./salesOrder.model.js";
import { InventoryModel } from "../inventory/inventory.model.js";
import { OrderStatus } from "./salesOrder.interface.js";

const roundNumber = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

const createSaleOrderIntoDB = async (payload: any) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const customer = await CustomerModel.findOne({ id: payload.customer }).session(session);
    if (!customer) throw new Error(`Customer not found: ${payload.customer}`);

    let productsSubtotal = 0;
    const calculatedProducts = [];

    for (const item of payload.products) {
      const product = await ProductModel.findOne({ id: item.product }).session(session);
      if (!product) throw new Error(`Product not found: ${item.product}`);

      const inventory = await InventoryModel.findOne({ product: product._id }).session(session);
      if (!inventory) throw new Error(`Inventory record not found for product: ${product.name}`);

      if (inventory.currentStock < item.quantity) {
        throw new Error(`Insufficient stock for ${product.name}. Available: ${inventory.currentStock}`);
      }

      const price = product.sellingPrice;
      const totalPrice = roundNumber(price * item.quantity);
      const itemDiscount = roundNumber(item.discount ?? 0);
      const afterDiscount = roundNumber(totalPrice - itemDiscount);

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

    // Apply General Discount if provided
    if (payload.generalDiscountType && payload.generalDiscountValue) {
      if (payload.generalDiscountType === "%") {
        const discountAmount = (grandTotal * payload.generalDiscountValue) / 100;
        grandTotal = roundNumber(grandTotal - discountAmount);
      } else if (payload.generalDiscountType === "flat") {
        grandTotal = roundNumber(grandTotal - payload.generalDiscountValue);
      }
    }

    const dueAmount = roundNumber(grandTotal - payload.paidAmount);

    const createdOrder = await SaleOrderModel.create([{
      ...payload,
      customer: customer._id,
      products: calculatedProducts,
      grandTotal,
      dueAmount,
      status: payload.status || "pending",
    }], { session });

    // Deduct stock from Inventory
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

    // Optional: Return stock back to inventory if order is deleted
    for (const item of order.products) {
      const inventory = await InventoryModel.findOne({ product: item.product }).session(session);
      if (inventory) {
        const updatedCurrentStock = inventory.currentStock + item.quantity;
        const updatedTotalSell = Math.max(0, (inventory.totalSell || 0) - item.quantity);
        const updatedTotalStock = inventory.totalStock + item.quantity;

        await InventoryModel.findOneAndUpdate(
          { product: item.product },
          {
            $set: {
              currentStock: updatedCurrentStock,
              totalStock: updatedTotalStock,
              totalSell: updatedTotalSell,
              totalStockValue: Number((updatedCurrentStock * inventory.avgBuyingPrice).toFixed(2)),
              totalSaleValue: Number(Math.max(0, (inventory.totalSaleValue || 0) - item.afterDiscount).toFixed(2)),
            },
          },
          { session }
        );
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
  getAllSaleOrdersFromDB,
  getSaleOrderByIdFromDB,
  updateSaleOrderStatusIntoDB,
  deleteSaleOrderFromDB,
};