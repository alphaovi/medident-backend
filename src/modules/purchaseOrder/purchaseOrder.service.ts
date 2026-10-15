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
        inventory.onTransit += Number(item.orderQuantity || 0);
      } else if (result.status === "Received") {
        inventory.currentStock += Number(item.orderQuantity || 0);
        inventory.totalStock += Number(item.orderQuantity || 0);

        const newTotalStockValue = inventory.totalStockValue + (Number(item.orderQuantity || 0) * Number(item.unitCost || 0));
        inventory.totalStockValue = newTotalStockValue;
        inventory.avgBuyingPrice = inventory.totalStock > 0 ? newTotalStockValue / inventory.totalStock : 0;
      }
      await inventory.save();
    }
  }

  return result;
};

// 2. Get All Purchase Orders
const getAllPurchaseOrdersFromDB = async () => {
  const result = await PurchaseOrderModel.find()
    .populate("supplierName")
    .populate("items.group")
    .populate("items.subGroup")
    .populate("items.product");
  return result;
};

// 3. Get Single Purchase Order
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

  const oldItems = existingOrder.items || [];
  const newItems = payload.items || oldItems;

  // SCENARIO A: If order was "On Transit" and is STILL "On Transit", update inventory based on net difference
  if (currentStatus === "On Transit" && newStatus === "On Transit") {
    const oldMap = new Map<string, number>();
    oldItems.forEach((i: any) => oldMap.set(String(i.product), (oldMap.get(String(i.product)) || 0) + Number(i.orderQuantity || 0)));

    const newMap = new Map<string, number>();
    newItems.forEach((i: any) => newMap.set(String(i.product), (newMap.get(String(i.product)) || 0) + Number(i.orderQuantity || 0)));

    const allProds = new Set([...oldMap.keys(), ...newMap.keys()]);

    for (const prodId of allProds) {
      const oldQty = oldMap.get(prodId) || 0;
      const newQty = newMap.get(prodId) || 0;
      const diff = newQty - oldQty;

      if (diff !== 0) {
        let inventory = await InventoryModel.findOne({ product: prodId });
        if (!inventory) {
          const sample = [...oldItems, ...newItems].find((i: any) => String(i.product) === prodId);
          inventory = await InventoryModel.create({
            product: prodId,
            group: sample?.group,
            subGroup: sample?.subGroup,
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
  }
  // SCENARIO B: If order was "Ordered" and is now updated to "On Transit"
  else if (currentStatus === "Ordered" && newStatus === "On Transit") {
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
      inventory.onTransit += Number(item.orderQuantity || 0);
      await inventory.save();
    }
  }
  // SCENARIO C: If order status becomes "Received" (from Ordered or On Transit)
  else if (newStatus === "Received") {
    // If it was On Transit before, remove old items from onTransit
    if (currentStatus === "On Transit") {
      for (const item of oldItems) {
        let inventory = await InventoryModel.findOne({ product: item.product });
        if (inventory) {
          inventory.onTransit = Math.max(0, inventory.onTransit - Number(item.orderQuantity || 0));
          await inventory.save();
        }
      }
    }

    // Add new items to currentStock
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

// 5. Delete Purchase Order
const deletePurchaseOrderFromDB = async (purchaseId: string) => {
  const existingOrder = await PurchaseOrderModel.findOne({ purchaseId });

  if (!existingOrder) {
    throw new Error("Purchase order not found!");
  }

  if (existingOrder.status === "On Transit") {
    for (const item of existingOrder.items) {
      const inventory = await InventoryModel.findOne({ product: item.product });
      if (inventory) {
        inventory.onTransit = Math.max(0, inventory.onTransit - Number(item.orderQuantity || 0));
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