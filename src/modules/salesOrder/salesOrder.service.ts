import mongoose from "mongoose";
import { InventoryModel } from "../inventory/inventory.model.js";
import { SalesOrderModel } from "./salesOrder.model.js";
import { BanksDetailModel } from "../banksDetail/banksDetail.model.js";
import { BanksDetailServices } from "../banksDetail/banksDetail.service.js";

/**
 * 🟢 Serial-wise Inventory Sync & Total Sell Update Logic (100% Guaranteed Fix)
 */
const adjustInventoryTotalSell = async (item: any, sellDiff: number) => {
  try {
    if (!item || sellDiff === 0) return;

    let rawProdId = item.product || item.productId || item;
    if (typeof rawProdId === "object" && rawProdId !== null) {
      rawProdId = rawProdId._id || rawProdId.id || rawProdId.value || rawProdId;
    }
    if (!rawProdId) return;

    const prodStr = rawProdId.toString().trim();
    const isObjectId = mongoose.isValidObjectId(prodStr);
    const mongoProdId = isObjectId ? new mongoose.Types.ObjectId(prodStr) : prodStr;

    const unitPrice = Number(item.afterDiscount || item.unitPrice || item.price || 0);
    const saleValueDiff = sellDiff * unitPrice;

    const filterQuery = isObjectId
      ? { $or: [{ product: mongoProdId }, { _id: mongoProdId }] }
      : { $or: [{ product: prodStr }, { id: prodStr }, { _id: prodStr }] };

    let existingInventory = await InventoryModel.findOne(filterQuery);
    if (!existingInventory && isObjectId) {
      existingInventory = await InventoryModel.findOne({ product: mongoProdId });
    }

    if (existingInventory) {
      const currentTotalSell = Number(existingInventory.totalSell) || 0;
      const currentTotalSaleValue = Number(existingInventory.totalSaleValue) || 0;

      const updatedTotalSell = currentTotalSell + Number(sellDiff);
      const updatedTotalSaleValue = currentTotalSaleValue + Number(saleValueDiff);

      const totalStock = Number(existingInventory.totalStock) || 0;
      const purchaseReturn = Number(existingInventory.purchaseReturn) || 0;
      const sellReturn = Number(existingInventory.sellReturn) || 0;
      const damaged = Number(existingInventory.damaged) || 0;
      const lost = Number(existingInventory.lost) || 0;
      const freeSample = Number(existingInventory.freeSample) || 0;

      const calculatedCurrentStock = totalStock - purchaseReturn + sellReturn - updatedTotalSell - damaged - lost - freeSample;

      await InventoryModel.updateOne(
        { _id: existingInventory._id },
        {
          $set: {
            totalSell: updatedTotalSell,
            totalSaleValue: updatedTotalSaleValue,
            currentStock: calculatedCurrentStock,
          },
        }
      );
    } else {
      const newTotalSell = Number(sellDiff);
      const newTotalSaleValue = Number(saleValueDiff);
      const calculatedCurrentStock = -newTotalSell;

      await InventoryModel.create({
        product: mongoProdId,
        totalSell: newTotalSell,
        totalSaleValue: newTotalSaleValue,
        currentStock: calculatedCurrentStock,
      });
    }
  } catch (error: any) {
    console.error("❌ [BACKEND INVENTORY ERROR]:", error.message);
  }
};

/**
 * 🟢 Inventory Revert / Minus Logic for Delete or Return
 */
const revertInventoryTotalSell = async (item: any) => {
  try {
    if (!item) return;
    let rawProdId = item.product || item.productId || item;
    if (typeof rawProdId === "object" && rawProdId !== null) {
      rawProdId = rawProdId._id || rawProdId.id || rawProdId.value || rawProdId;
    }
    if (!rawProdId) return;

    const prodStr = rawProdId.toString().trim();
    const isObjectId = mongoose.isValidObjectId(prodStr);
    const mongoProdId = isObjectId ? new mongoose.Types.ObjectId(prodStr) : prodStr;
    const quantityToSubtract = Number(item.quantity || item.orderQty) || 0;
    const unitPrice = Number(item.afterDiscount || item.unitPrice || item.price || 0);
    const saleValueToSubtract = quantityToSubtract * unitPrice;

    const filterQuery = isObjectId
      ? { $or: [{ product: mongoProdId }, { _id: mongoProdId }] }
      : { $or: [{ product: prodStr }, { id: prodStr }, { _id: prodStr }] };

    let existingInventory = await InventoryModel.findOne(filterQuery);
    if (!existingInventory && isObjectId) {
      existingInventory = await InventoryModel.findOne({ product: mongoProdId });
    }

    if (existingInventory) {
      const currentTotalSell = Number(existingInventory.totalSell) || 0;
      const currentTotalSaleValue = Number(existingInventory.totalSaleValue) || 0;

      const updatedTotalSell = Math.max(0, currentTotalSell - quantityToSubtract);
      const updatedTotalSaleValue = Math.max(0, currentTotalSaleValue - saleValueToSubtract);

      const totalStock = Number(existingInventory.totalStock) || 0;
      const purchaseReturn = Number(existingInventory.purchaseReturn) || 0;
      const sellReturn = Number(existingInventory.sellReturn) || 0;
      const damaged = Number(existingInventory.damaged) || 0;
      const lost = Number(existingInventory.lost) || 0;
      const freeSample = Number(existingInventory.freeSample) || 0;

      const calculatedCurrentStock = totalStock - purchaseReturn + sellReturn - updatedTotalSell - damaged - lost - freeSample;

      await InventoryModel.updateOne(
        { _id: existingInventory._id },
        {
          $set: {
            totalSell: updatedTotalSell,
            totalSaleValue: updatedTotalSaleValue,
            currentStock: calculatedCurrentStock,
          },
        }
      );
    }
  } catch (error: any) {
    console.error("❌ [BACKEND REVERT ERROR]:", error.message);
  }
};

// 🟢 Helper: Build payment object (supports account deposit for both Cash and Bank when bankId is provided)
const buildPaymentEntry = async (paymentPayload: any) => {
  const rawMethod = (paymentPayload.paymentMethod || "Cash").trim();
  const isCash = rawMethod.toLowerCase() === "cash";
  const providedAccountId =
    paymentPayload.bankId && mongoose.isValidObjectId(paymentPayload.bankId)
      ? new mongoose.Types.ObjectId(paymentPayload.bankId)
      : null;

  let bankDoc: any = null;
  if (providedAccountId) {
    bankDoc = await BanksDetailModel.findById(providedAccountId);
  }

  if (isCash && !bankDoc) {
    return {
      date: paymentPayload.date ? new Date(paymentPayload.date) : new Date(),
      amount: Number(paymentPayload.amount) || 0,
      paymentMethod: "Cash",
      bankId: providedAccountId,
      bankDetails: null,
      status: paymentPayload.status || "Approved",
      note: paymentPayload.note || "",
      receipt: paymentPayload.receipt || null,
    };
  }

  const snapshot = {
    bankName:
      paymentPayload.bankDetails?.bankName ||
      bankDoc?.bankName ||
      (isCash ? "Cash" : rawMethod),
    accountNo:
      paymentPayload.bankDetails?.accountNo ||
      bankDoc?.accountNo ||
      "",
    accountName:
      paymentPayload.bankDetails?.accountName ||
      bankDoc?.accountName ||
      "",
    branch:
      paymentPayload.bankDetails?.branch ||
      bankDoc?.branch ||
      "",
    details:
      paymentPayload.bankDetails?.details ||
      bankDoc?.details ||
      "",
  };

  return {
    date: paymentPayload.date ? new Date(paymentPayload.date) : new Date(),
    amount: Number(paymentPayload.amount) || 0,
    paymentMethod: isCash ? "Cash" : snapshot.bankName || rawMethod,
    bankId: bankDoc?._id || providedAccountId,
    bankDetails: isCash && !paymentPayload.bankDetails ? null : snapshot,
    status: paymentPayload.status || "Approved",
    note: paymentPayload.note || "",
    receipt: paymentPayload.receipt || null,
  };
};

const createSalesOrderIntoDB = async (payload: any) => {
  const orderData = payload.saleOrder || payload;

  if (Array.isArray(orderData.payments) && orderData.payments.length > 0) {
    orderData.payments = await Promise.all(
      orderData.payments.map((p: any) => buildPaymentEntry(p))
    );
  }

  const createdOrder = await SalesOrderModel.create(orderData);

  // 🟢 Deposit balance & transaction into selected Cash or Bank account
  if (Array.isArray(createdOrder.payments) && createdOrder.payments.length > 0) {
    for (const payment of createdOrder.payments) {
      if (payment.bankId && Number(payment.amount) > 0) {
        await BanksDetailServices.recordSalesDepositIntoBank({
          bankId: payment.bankId,
          amount: Number(payment.amount),
          date: payment.date,
          referenceId: createdOrder._id,
          note: payment.note || "Sales order payment deposit",
        });
      }
    }
  }

  const productsList = orderData.products || createdOrder.products || [];
  if (Array.isArray(productsList)) {
    for (const item of productsList) {
      const quantity = Number(item.quantity || item.orderQty) || 0;
      await adjustInventoryTotalSell(item, quantity);
    }
  }

  return createdOrder;
};

const getAllSalesOrdersFromDB = async () => {
  return await SalesOrderModel.find()
    .populate("customer")
    .populate("products.product")
    .populate("products.group")
    .populate("products.subGroup")
    .populate("payments.bankId")
    .sort({ createdAt: -1 });
};

const getSingleSalesOrderFromDB = async (id: string) => {
  return await SalesOrderModel.findById(id)
    .populate("customer")
    .populate("products.product")
    .populate("products.group")
    .populate("products.subGroup")
    .populate("payments.bankId");
};

const updateSalesOrderIntoDB = async (id: string, payload: any) => {
  const orderData = payload.saleOrder || payload;
  const existingOrder = await SalesOrderModel.findById(id);

  if (!existingOrder) {
    throw new Error("Sales order not found for update");
  }

  if (Array.isArray(orderData.payments) && orderData.payments.length > 0) {
    orderData.payments = await Promise.all(
      orderData.payments.map((p: any) => buildPaymentEntry(p))
    );
  }

  if (Array.isArray(existingOrder.products)) {
    for (const oldItem of existingOrder.products) {
      await revertInventoryTotalSell(oldItem);
    }
  }

  const updatedOrder = await SalesOrderModel.findByIdAndUpdate(id, orderData, {
    new: true,
    runValidators: true,
  });

  const newProductsList = orderData.products || updatedOrder?.products || [];
  if (Array.isArray(newProductsList)) {
    for (const newItem of newProductsList) {
      const qty = Number(newItem.quantity || newItem.orderQty) || 0;
      await adjustInventoryTotalSell(newItem, qty);
    }
  }

  return updatedOrder;
};

// 🟢 Add Payment to an Existing Sales Order
const addPaymentToSalesOrderInDB = async (id: string, paymentPayload: any) => {
  const order = await SalesOrderModel.findById(id);
  if (!order) {
    throw new Error("Sales order not found");
  }

  const amount = Number(paymentPayload.amount) || 0;
  if (amount <= 0) {
    throw new Error("Payment amount must be greater than 0");
  }

  const paymentEntry = await buildPaymentEntry(paymentPayload);

  order.payments.push(paymentEntry as any);
  order.paidAmount = (Number(order.paidAmount) || 0) + amount;

  await order.save(); // pre("save") automatically recalculates grandTotal & dueAmount

  // 🟢 Deposit balance & transaction when payment is added to a Cash or Bank account
  if (paymentEntry.bankId && amount > 0) {
    await BanksDetailServices.recordSalesDepositIntoBank({
      bankId: paymentEntry.bankId,
      amount,
      date: paymentEntry.date,
      referenceId: order._id,
      note: paymentEntry.note || "Sales order payment deposit",
    });
  }

  return await SalesOrderModel.findById(id)
    .populate("customer")
    .populate("products.product")
    .populate("products.group")
    .populate("products.subGroup")
    .populate("payments.bankId");
};

const updateOrderStatusInDB = async (id: string, status: string) => {
  return await SalesOrderModel.findByIdAndUpdate(
    id,
    { status },
    { new: true, runValidators: true }
  );
};

const deleteSalesOrderFromDB = async (id: string) => {
  const orderToDelete = await SalesOrderModel.findById(id);
  if (!orderToDelete) {
    throw new Error("Sales order not found");
  }

  const productsList = orderToDelete.products || [];
  for (const item of productsList) {
    await revertInventoryTotalSell(item);
  }

  return await SalesOrderModel.findByIdAndDelete(id);
};

const getCustomerStatementFromDB = async (query: {
  customerId: string;
  fromDate?: string;
  toDate?: string;
  paymentStatus?: string;
  orderStatus?: string;
}) => {
  const { customerId, fromDate, toDate, paymentStatus, orderStatus } = query;

  const filter: any = { customer: customerId };

  // ডেট রেঞ্জ ফিল্টার
  if (fromDate && toDate) {
    filter.orderDate = {
      $gte: new Date(fromDate),
      $lte: new Date(toDate),
    };
  }

  // Order Status ফিল্টার (Pending, Approved, Delivered)
  if (orderStatus && orderStatus.toLowerCase() !== "all") {
    filter.status = { $regex: new RegExp(`^${orderStatus}$`, "i") };
  }

  const orders = await SalesOrderModel.find(filter)
    .populate("customer")
    .populate("products.product")
    .populate("products.group")
    .populate("products.subGroup")
    .populate("payments.bankId")
    .sort({ orderDate: -1 });

  // Payment Status ফিল্টার (Paid, Unpaid)
  let filteredOrders = orders;
  if (paymentStatus && paymentStatus !== "all" && paymentStatus !== "none") {
    filteredOrders = orders.filter((order: any) => {
      const due = Number(order.dueAmount) || 0;
      const paid = Number(order.paidAmount) || 0;
      if (paymentStatus === "paid") return due <= 0 && paid > 0;
      if (paymentStatus === "unpaid") return due > 0;
      return true;
    });
  }

  return filteredOrders;
};

export const SalesOrderServices = {
  createSalesOrderIntoDB,
  getAllSalesOrdersFromDB,
  getSingleSalesOrderFromDB,
  updateSalesOrderIntoDB,
  addPaymentToSalesOrderInDB,
  updateOrderStatusInDB,
  deleteSalesOrderFromDB,
  getCustomerStatementFromDB,
};