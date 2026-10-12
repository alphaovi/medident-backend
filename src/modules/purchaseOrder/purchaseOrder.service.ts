import { PurchaseOrderModel } from "./purchaseOrder.model.js";
import { InventoryModel } from "../inventory/inventory.model.js"; // Inventory model import kora holo

// 1. Create Purchase Order
const createPurchaseOrderIntoDB = async (payload: any) => {
  const result = await PurchaseOrderModel.create(payload);
  
  // Jodi create korar samay status "On Transit" ba "Received" thake, tahoke inventory update hobe
  if (result.status === "On Transit" || result.status === "Received") {
    for (const item of result.items) {
      const inventory = await InventoryModel.findOne({ product: item.product });

      if (inventory) {
        if (result.status === "On Transit") {
          inventory.onTransit += item.orderQuantity;
        } else if (result.status === "Received") {
          inventory.currentStock += item.orderQuantity;
          inventory.totalStock += item.orderQuantity;

          // Price & Value Calculation
          const newTotalStockValue = inventory.totalStockValue + (item.orderQuantity * item.unitCost);
          inventory.totalStockValue = newTotalStockValue;
          inventory.avgBuyingPrice = inventory.totalStock > 0 ? newTotalStockValue / inventory.totalStock : 0;
        }
        await inventory.save();
      } else {
        // Jodi inventory record age theke na thake, tobe notun create kore nibe
        const initialStock = result.status === "Received" ? item.orderQuantity : 0;
        const initialTransit = result.status === "On Transit" ? item.orderQuantity : 0;
        const totalStockValue = initialStock * item.unitCost;

        await InventoryModel.create({
          product: item.product,
          group: item.group,
          subGroup: item.subGroup,
          totalStock: initialStock,
          currentStock: initialStock,
          onTransit: initialTransit,
          avgBuyingPrice: initialStock > 0 ? item.unitCost : 0,
          totalStockValue: totalStockValue,
        });
      }
    }
  }

  return result;
};

// 2. Get All Purchase Orders
const getAllPurchaseOrdersFromDB = async () => {
  const result = await PurchaseOrderModel.find().populate("supplierName");
  return result;
};

// 3. Get Single Purchase Order by purchaseId
const getSinglePurchaseOrderFromDB = async (purchaseId: string) => {
  const result = await PurchaseOrderModel.findOne({ purchaseId: purchaseId }).populate("supplierName");
  return result;
};

// 4. Update Purchase Order & Handle Inventory (Status transition flow)
const updatePurchaseOrderInDB = async (purchaseId: string, payload: any) => {
  const existingOrder = await PurchaseOrderModel.findOne({ purchaseId });

  if (!existingOrder) {
    throw new Error("Purchase order not found!");
  }

  const currentStatus = existingOrder.status;
  const newStatus = payload.status;

  if (currentStatus === "Received") {
    throw new Error("This purchase order has already been received and cannot be edited!");
  }

  if (newStatus && currentStatus !== newStatus) {
    const statusHierarchy: { [key: string]: number } = {
      "Ordered": 1,
      "On Transit": 2,
      "Received": 3,
    };

    if (statusHierarchy[newStatus] < statusHierarchy[currentStatus]) {
      throw new Error(`Invalid status transition! You cannot move status backward from '${currentStatus}' to '${newStatus}'.`);
    }
  }

  // Inventory logic handle kora hocche status change er upor ভিত্তি kore:
  if (newStatus && currentStatus !== newStatus) {
    for (const item of existingOrder.items) {
      let inventory = await InventoryModel.findOne({ product: item.product });

      if (!inventory) {
        // Jodi inventory record na thake, tahoke default baniye nibe
        inventory = await InventoryModel.create({
          product: item.product,
          group: item.group,
          subGroup: item.subGroup,
          totalStock: 0,
          currentStock: 0,
          onTransit: 0,
          avgBuyingPrice: 0,
          totalStockValue: 0,
        });
      }

      if (currentStatus === "Ordered" && newStatus === "On Transit") {
        // Ordered -> On Transit: onTransit barbe
        inventory.onTransit += item.orderQuantity;
      } 
      else if (currentStatus === "On Transit" && newStatus === "Received") {
        // On Transit -> Received: onTransit theke minus hobe, currentStock o totalStock a add hobe
        inventory.onTransit = Math.max(0, inventory.onTransit - item.orderQuantity);
        inventory.currentStock += item.orderQuantity;
        inventory.totalStock += item.orderQuantity;

        const newTotalStockValue = inventory.totalStockValue + (item.orderQuantity * item.unitCost);
        inventory.totalStockValue = newTotalStockValue;
        inventory.avgBuyingPrice = inventory.totalStock > 0 ? newTotalStockValue / inventory.totalStock : 0;
      } 
      else if (currentStatus === "Ordered" && newStatus === "Received") {
        // Ordered -> Received (Direct): currentStock o totalStock a add hobe (onTransit touch korbe na)
        inventory.currentStock += item.orderQuantity;
        inventory.totalStock += item.orderQuantity;

        const newTotalStockValue = inventory.totalStockValue + (item.orderQuantity * item.unitCost);
        inventory.totalStockValue = newTotalStockValue;
        inventory.avgBuyingPrice = inventory.totalStock > 0 ? newTotalStockValue / inventory.totalStock : 0;
      }

      await inventory.save();
    }
  }

  const result = await PurchaseOrderModel.findOneAndUpdate(
    { purchaseId: purchaseId },
    payload,
    {
      new: true,
      runValidators: true,
    }
  ).populate("supplierName");
  
  return result;
};

// 5. Delete Purchase Order by purchaseId
const deletePurchaseOrderFromDB = async (purchaseId: string) => {
  const result = await PurchaseOrderModel.findOneAndDelete({ purchaseId: purchaseId });
  return result;
};

export const PurchaseOrderServices = {
  createPurchaseOrderIntoDB,
  getAllPurchaseOrdersFromDB,
  getSinglePurchaseOrderFromDB,
  updatePurchaseOrderInDB,
  deletePurchaseOrderFromDB,
};