// purchaseOrder.service.ts
import { PurchaseOrderModel } from "./purchaseOrder.model.js";
import { InventoryModel } from "../inventory/inventory.model.js";

// 1. Create Purchase Order
const createPurchaseOrderIntoDB = async (payload: any) => {
  const result = await PurchaseOrderModel.create(payload);
  
  if (result.status === "On Transit" || result.status === "Received") {
    for (const item of result.items) {
      let inventory = await InventoryModel.findOne({ product: item.product });

      if (!inventory) {
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

      if (result.status === "On Transit") {
        inventory.onTransit += item.orderQuantity;
      } else if (result.status === "Received") {
        inventory.currentStock += item.orderQuantity;
        inventory.totalStock += item.orderQuantity;

        const newTotalStockValue = inventory.totalStockValue + (item.orderQuantity * item.unitCost);
        inventory.totalStockValue = newTotalStockValue;
        inventory.avgBuyingPrice = inventory.totalStock > 0 ? newTotalStockValue / inventory.totalStock : 0;
      }
      await inventory.save();
    }
  }

  return result;
};

// 2. Get All Purchase Orders (POPULATED FULLY)
const getAllPurchaseOrdersFromDB = async () => {
  const result = await PurchaseOrderModel.find()
    .populate("supplierName")
    .populate("items.group")
    .populate("items.subGroup")
    .populate("items.product");
  return result;
};

// 3. Get Single Purchase Order by purchaseId (POPULATED FULLY)
const getSinglePurchaseOrderFromDB = async (purchaseId: string) => {
  const result = await PurchaseOrderModel.findOne({ purchaseId: purchaseId })
    .populate("supplierName")
    .populate("items.group")
    .populate("items.subGroup")
    .populate("items.product");
  return result;
};

// 4. Update Purchase Order & Handle Inventory Accurately
const updatePurchaseOrderInDB = async (purchaseId: string, payload: any) => {
  const existingOrder = await PurchaseOrderModel.findOne({ purchaseId });

  if (!existingOrder) {
    throw new Error("Purchase order not found!");
  }

  const currentStatus = existingOrder.status;
  const newStatus = payload.status || currentStatus;

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

  // STEP 1: Revert old inventory effect if old order was On Transit
  if (currentStatus === "On Transit") {
    for (const oldItem of existingOrder.items) {
      const inventory = await InventoryModel.findOne({ product: oldItem.product });
      if (inventory) {
        inventory.onTransit = Math.max(0, inventory.onTransit - oldItem.orderQuantity);
        await inventory.save();
      }
    }
  }

  // STEP 2: Determine effective items & status for new update
  const effectiveItems = payload.items || existingOrder.items;

  // STEP 3: Apply new inventory effect if new status is On Transit or Received
  if (newStatus === "On Transit" || newStatus === "Received") {
    for (const newItem of effectiveItems) {
      let inventory = await InventoryModel.findOne({ product: newItem.product });

      if (!inventory) {
        inventory = await InventoryModel.create({
          product: newItem.product,
          group: newItem.group,
          subGroup: newItem.subGroup,
          totalStock: 0,
          currentStock: 0,
          onTransit: 0,
          avgBuyingPrice: 0,
          totalStockValue: 0,
        });
      }

      if (newStatus === "On Transit") {
        inventory.onTransit += Number(newItem.orderQuantity || 0);
      } else if (newStatus === "Received") {
        inventory.currentStock += Number(newItem.orderQuantity || 0);
        inventory.totalStock += Number(newItem.orderQuantity || 0);

        const newTotalStockValue = inventory.totalStockValue + (Number(newItem.orderQuantity || 0) * Number(newItem.unitCost || 0));
        inventory.totalStockValue = newTotalStockValue;
        inventory.avgBuyingPrice = inventory.totalStock > 0 ? newTotalStockValue / inventory.totalStock : 0;
      }

      await inventory.save();
    }
  }

  // STEP 4: Update Purchase Order in DB
  const result = await PurchaseOrderModel.findOneAndUpdate(
    { purchaseId: purchaseId },
    payload,
    {
      new: true,
      runValidators: true,
    }
  )
    .populate("supplierName")
    .populate("items.group")
    .populate("items.subGroup")
    .populate("items.product");
  
  return result;
};

// 5. Delete Purchase Order by purchaseId & Revert Inventory
const deletePurchaseOrderFromDB = async (purchaseId: string) => {
  const existingOrder = await PurchaseOrderModel.findOne({ purchaseId });

  if (!existingOrder) {
    throw new Error("Purchase order not found!");
  }

  // If order was On Transit, revert inventory onTransit before deleting
  if (existingOrder.status === "On Transit") {
    for (const item of existingOrder.items) {
      const inventory = await InventoryModel.findOne({ product: item.product });
      if (inventory) {
        inventory.onTransit = Math.max(0, inventory.onTransit - item.orderQuantity);
        await inventory.save();
      }
    }
  }

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