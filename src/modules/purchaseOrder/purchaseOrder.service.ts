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

// 4. Update Purchase Order & Handle Inventory with Net Difference Logic
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

  const newItems = payload.items || existingOrder.items;

  // Build maps for old quantities vs new quantities if status is On Transit
  const oldTransitMap = new Map<string, number>();
  if (currentStatus === "On Transit") {
    for (const item of existingOrder.items) {
      const prodId = String(item.product);
      oldTransitMap.set(prodId, (oldTransitMap.get(prodId) || 0) + item.orderQuantity);
    }
  }

  const newTransitMap = new Map<string, number>();
  if (newStatus === "On Transit") {
    for (const item of newItems) {
      const prodId = String(item.product);
      newTransitMap.set(prodId, (newTransitMap.get(prodId) || 0) + Number(item.orderQuantity || 0));
    }
  }

  // Calculate net difference for each product and update inventory onTransit
  const allProductIds = new Set([...oldTransitMap.keys(), ...newTransitMap.keys()]);

  for (const prodId of allProductIds) {
    const oldQty = oldTransitMap.get(prodId) || 0;
    const newQty = newTransitMap.get(prodId) || 0;
    const diff = newQty - oldQty; // Net change (+ or -)

    if (diff !== 0) {
      let inventory = await InventoryModel.findOne({ product: prodId });
      if (!inventory) {
        const sampleItem = [...existingOrder.items, ...newItems].find(i => String(i.product) === prodId);
        inventory = await InventoryModel.create({
          product: prodId,
          group: sampleItem?.group,
          subGroup: sampleItem?.subGroup,
          totalStock: 0,
          currentStock: 0,
          onTransit: 0,
          avgBuyingPrice: 0,
          totalStockValue: 0,
        });
      }

      inventory.onTransit = Math.max(0, inventory.onTransit + diff);
      await inventory.save();
    }
  }

  // If status is updated to Received
  if (currentStatus !== "Received" && newStatus === "Received") {
    for (const item of newItems) {
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

      const oldQty = oldTransitMap.get(String(item.product)) || 0;
      if (currentStatus === "On Transit" && oldQty > 0) {
        inventory.onTransit = Math.max(0, inventory.onTransit - oldQty);
      }

      const orderQty = Number(item.orderQuantity || 0);
      inventory.currentStock += orderQty;
      inventory.totalStock += orderQty;

      const newTotalStockValue = inventory.totalStockValue + (orderQty * Number(item.unitCost || 0));
      inventory.totalStockValue = newTotalStockValue;
      inventory.avgBuyingPrice = inventory.totalStock > 0 ? newTotalStockValue / inventory.totalStock : 0;

      await inventory.save();
    }
  }

  // Update Purchase Order in DB
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