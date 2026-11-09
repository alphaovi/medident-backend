import mongoose from "mongoose";
import { ProductModel } from "../product/product.model.js";
import { CustomerModel } from "../customers/customer.model.js";
import { SaleOrderModel } from "./salesOrder.model.js";
import { InventoryModel } from "../inventory/inventory.model.js";

const roundNumber = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

const getId = (value: any) => {
  if (!value) return value;
  if (typeof value === "object") {
    return value._id || value.id || value.value || value;
  }
  return value;
};

const findCustomer = async (id: any, session: mongoose.ClientSession) => {
  const customerId = getId(id);
  const query = mongoose.Types.ObjectId.isValid(String(customerId))
    ? { $or: [{ id: String(customerId) }, { _id: customerId }] }
    : { id: customerId };

  const customer = await CustomerModel.findOne(query).session(session);
  if (!customer) throw new Error(`Customer not found: ${customerId}`);
  return customer;
};

const findProduct = async (id: any, session: mongoose.ClientSession) => {
  const productId = getId(id);
  const query = mongoose.Types.ObjectId.isValid(String(productId))
    ? { $or: [{ id: String(productId) }, { _id: productId }] }
    : { id: productId };

  const product = await ProductModel.findOne(query).session(session);
  if (!product) throw new Error(`Product not found: ${productId}`);
  return product;
};

const calculateDiscount = (
  totalPrice: number,
  discountType: string,
  discountValue: number
) => {
  const type = discountType === "flat" ? "flat" : "percent";
  const value = Math.max(0, Number(discountValue) || 0);

  const discount =
    type === "percent"
      ? roundNumber((totalPrice * Math.min(value, 100)) / 100)
      : roundNumber(Math.min(value, totalPrice));

  return {
    discountType: type,
    discountValue: value,
    discount,
    afterDiscount: roundNumber(Math.max(0, totalPrice - discount)),
  };
};

const calculateProducts = async (
  products: any[],
  session: mongoose.ClientSession
) => {
  if (!Array.isArray(products) || products.length === 0) {
    throw new Error("At least one product is required");
  }

  let productsSubtotal = 0;
  const calculatedProducts: any[] = [];

  for (const item of products) {
    const product = await findProduct(item.product, session);

    const quantity = Number(item.quantity);
    const price = Number(item.price);

    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new Error(`Invalid quantity for ${product.name}`);
    }

    if (!Number.isFinite(price) || price < 0) {
      throw new Error(`Invalid price for ${product.name}`);
    }

    const totalPrice = roundNumber(quantity * price);

    // Strict Force mapping from payload
    const discountType = item.discountType === "flat" ? "flat" : "percent";
    const discountValue = Number(item.discountValue) || 0;

    const discountData = calculateDiscount(
      totalPrice,
      discountType,
      discountValue
    );

    productsSubtotal = roundNumber(productsSubtotal + discountData.afterDiscount);

    calculatedProducts.push({
      group: getId(item.group) || product.group,
      subGroup: getId(item.subGroup) || product.subGroup,
      product: product._id,
      quantity,
      price,
      discountType: discountData.discountType,
      discountValue: discountData.discountValue,
      discount: discountData.discount,
      totalPrice,
      afterDiscount: discountData.afterDiscount,
    });
  }

  return { calculatedProducts, productsSubtotal };
};

const calculateGeneralDiscount = (
  subtotal: number,
  discountType: string,
  discountValue: number
) => {
  const type = discountType === "flat" ? "flat" : "%";
  const value = Math.max(0, Number(discountValue) || 0);
  const discount =
    type === "%"
      ? roundNumber((subtotal * Math.min(value, 100)) / 100)
      : roundNumber(Math.min(value, subtotal));

  return {
    generalDiscountType: type,
    generalDiscountValue: value,
    generalDiscountAmount: discount,
    grandTotal: roundNumber(Math.max(0, subtotal - discount)),
  };
};

const groupProducts = (products: any[]) => {
  const grouped = new Map<string, any>();
  for (const item of products) {
    const productId = String(getId(item.product));
    if (grouped.has(productId)) {
      const existing = grouped.get(productId);
      existing.quantity += Number(item.quantity);
      existing.saleValue += Number(item.afterDiscount);
    } else {
      grouped.set(productId, {
        product: getId(item.product),
        quantity: Number(item.quantity),
        saleValue: Number(item.afterDiscount),
      });
    }
  }
  return Array.from(grouped.values());
};

const validateStock = async (products: any[], session: mongoose.ClientSession) => {
  for (const item of groupProducts(products)) {
    const inventory = await InventoryModel.findOne({ product: item.product }).session(session);
    if (!inventory) throw new Error(`Inventory not found for product: ${item.product}`);
    if (Number(inventory.currentStock || 0) < item.quantity) {
      throw new Error(`Insufficient stock. Available: ${inventory.currentStock}, Required: ${item.quantity}`);
    }
  }
};

const adjustInventory = async (products: any[], direction: 1 | -1, session: mongoose.ClientSession) => {
  for (const item of groupProducts(products)) {
    const inventory = await InventoryModel.findOne({ product: item.product }).session(session);
    if (!inventory) throw new Error(`Inventory not found for product: ${item.product}`);

    const totalSell = Math.max(0, Number(inventory.totalSell || 0) + item.quantity * direction);
    const totalSaleValue = roundNumber(Math.max(0, Number(inventory.totalSaleValue || 0) + item.saleValue * direction));
    const currentStock = Math.max(0, Number(inventory.totalStock || 0) - totalSell - Number(inventory.damaged || 0) - Number(inventory.lost || 0) - Number(inventory.freeSample || 0) - Number(inventory.purchaseReturn || 0) + Number(inventory.sellReturn || 0));
    const totalStockValue = roundNumber(currentStock * Number(inventory.avgBuyingPrice || 0));

    await InventoryModel.updateOne(
      { _id: inventory._id },
      { $set: { totalSell, totalSaleValue, currentStock, totalStockValue } },
      { session }
    );
  }
};

const calculatePayments = (paidAmount: number, payments: any[], orderDate: Date) => {
  const paid = roundNumber(Math.max(0, Number(paidAmount) || 0));
  let paymentList = Array.isArray(payments)
    ? payments.map((p) => ({ amount: Number(p.amount) || 0, date: p.date || orderDate || new Date() }))
    : [];

  paymentList = paymentList.filter((p) => p.amount > 0);
  const paymentTotal = roundNumber(paymentList.reduce((acc, p) => acc + p.amount, 0));

  if (paymentList.length === 0 && paid > 0) {
    paymentList = [{ amount: paid, date: orderDate || new Date() }];
  }

  return {
    paidAmount: paymentList.length > 0 ? paymentTotal : paid,
    payments: paymentList,
  };
};

const createSaleOrderIntoDB = async (payload: any) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const customer = await findCustomer(payload.customer, session);
    const { calculatedProducts, productsSubtotal } = await calculateProducts(payload.products, session);
    await validateStock(calculatedProducts, session);

    const generalDiscount = calculateGeneralDiscount(
      productsSubtotal,
      payload.generalDiscountType ?? "%",
      payload.generalDiscountValue ?? 0
    );

    const paymentData = calculatePayments(payload.paidAmount, payload.payments, payload.orderDate);
    const dueAmount = roundNumber(Math.max(0, generalDiscount.grandTotal - paymentData.paidAmount));

    const saleOrder = new SaleOrderModel({
      stateOrRegion: payload.stateOrRegion || "",
      customer: customer._id,
      orderDate: payload.orderDate || new Date(),
      products: calculatedProducts,
      generalDiscountType: generalDiscount.generalDiscountType,
      generalDiscountValue: generalDiscount.generalDiscountValue,
      paidAmount: paymentData.paidAmount,
      payments: paymentData.payments,
      grandTotal: generalDiscount.grandTotal,
      dueAmount,
      status: payload.status || "pending",
    });

    await saleOrder.save({ session });
    await adjustInventory(calculatedProducts, 1, session);
    await session.commitTransaction();
    return saleOrder;
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
    if (!mongoose.Types.ObjectId.isValid(id)) throw new Error("Invalid Sale Order ID");

    const existingOrder = await SaleOrderModel.findById(id).session(session);
    if (!existingOrder) throw new Error("Sale order not found");

    const customer = await findCustomer(payload.customer ?? existingOrder.customer, session);
    await adjustInventory(existingOrder.products, -1, session);

    const products = payload.products ?? existingOrder.products;
    const { calculatedProducts, productsSubtotal } = await calculateProducts(products, session);
    await validateStock(calculatedProducts, session);

    const generalDiscount = calculateGeneralDiscount(
      productsSubtotal,
      payload.generalDiscountType ?? existingOrder.generalDiscountType ?? "%",
      payload.generalDiscountValue ?? existingOrder.generalDiscountValue ?? 0
    );

    const orderDate = payload.orderDate ?? existingOrder.orderDate;
    const paymentData = calculatePayments(
      payload.paidAmount ?? existingOrder.paidAmount,
      payload.payments ?? existingOrder.payments,
      orderDate
    );

    const dueAmount = roundNumber(Math.max(0, generalDiscount.grandTotal - paymentData.paidAmount));

    await adjustInventory(calculatedProducts, 1, session);

    existingOrder.set({
      stateOrRegion: payload.stateOrRegion ?? existingOrder.stateOrRegion,
      customer: customer._id,
      orderDate,
      products: calculatedProducts,
      generalDiscountType: generalDiscount.generalDiscountType,
      generalDiscountValue: generalDiscount.generalDiscountValue,
      paidAmount: paymentData.paidAmount,
      payments: paymentData.payments,
      grandTotal: generalDiscount.grandTotal,
      dueAmount,
      status: payload.status ?? existingOrder.status,
    });

    await existingOrder.save({ session });
    await session.commitTransaction();
    return existingOrder;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};

const getAllSaleOrdersFromDB = async () => {
  return SaleOrderModel.find()
    .populate("customer")
    .populate("products.group")
    .populate("products.subGroup")
    .populate("products.product")
    .sort({ createdAt: -1 });
};

const getSaleOrderByIdFromDB = async (id: string) => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new Error("Invalid Sale Order ID");
  return SaleOrderModel.findById(id)
    .populate("customer")
    .populate("products.group")
    .populate("products.subGroup")
    .populate("products.product");
};

const updateSaleOrderStatusIntoDB = async (id: string, status: string) => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new Error("Invalid Sale Order ID");
  const allowedStatuses = ["pending", "approved", "delivered"];
  const normalizedStatus = String(status).toLowerCase();
  if (!allowedStatuses.includes(normalizedStatus)) throw new Error("Invalid sale order status");

  return SaleOrderModel.findByIdAndUpdate(
    id,
    { $set: { status: normalizedStatus } },
    { new: true, runValidators: true }
  );
};

const deleteSaleOrderFromDB = async (id: string) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    if (!mongoose.Types.ObjectId.isValid(id)) throw new Error("Invalid Sale Order ID");

    const orderToDelete = await SaleOrderModel.findById(id).session(session);
    if (!orderToDelete) throw new Error("Sale order not found");

    await adjustInventory(orderToDelete.products, -1, session);
    await SaleOrderModel.deleteOne({ _id: id }, { session });
    await session.commitTransaction();
    return orderToDelete;
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