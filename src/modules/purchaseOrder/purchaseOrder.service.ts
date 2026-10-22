// purchaseOrder.service.ts
import { PurchaseOrderModel } from "./purchaseOrder.model.js";
import { InventoryModel } from "../inventory/inventory.model.js";

const createPurchaseOrderIntoDB = async (payload: any) => {
  const result = await PurchaseOrderModel.create(payload);
  
  if (result.status === "On Transit" || result.status === "Received") {
    const productIds = result.items.map((item: any) => item.product);
    const inventories = await InventoryModel.find({ product: { $in: productIds } });
    const invMap = new Map(inventories.map((inv) => [String(inv.product), inv]));

    const inventoryPromises = result.items.map(async (item: any) => {
      let inventory = invMap.get(String(item.product));

      if (!inventory) {
        inventory = new InventoryModel({
          product: item.product,
          group: item.group || null,
          subGroup: item.subGroup || null,
          totalStock: 0,
          currentStock: 0,
          onTransit: 0,
          avgBuyingPrice: 0,
          totalStockValue: 0,
        });
      } else {
        if (!inventory.group && item.group) inventory.group = item.group;
        if (!inventory.subGroup && item.subGroup) inventory.subGroup = item.subGroup;
      }

      if (result.status === "On Transit") {
        inventory.onTransit += Number(item.orderQuantity || 0);
      } else if (result.status === "Received") {
        const orderQty = Number(item.orderQuantity || 0);
        inventory.currentStock += orderQty;
        inventory.totalStock += orderQty;

        const newTotalStockValue = inventory.totalStockValue + (orderQty * Number(item.unitCost || 0));
        inventory.totalStockValue = newTotalStockValue;
        inventory.avgBuyingPrice = inventory.totalStock > 0 ? newTotalStockValue / inventory.totalStock : 0;
      }
      return inventory.save();
    });

    await Promise.all(inventoryPromises);
  }

  return result;
};

const getAllPurchaseOrdersFromDB = async () => {
  return await PurchaseOrderModel.find()
    .populate("supplierName")
    .populate("items.group")
    .populate("items.subGroup")
    .populate("items.product");
};

const getSinglePurchaseOrderFromDB = async (purchaseId: string) => {
  return await PurchaseOrderModel.findOne({ purchaseId: purchaseId })
    .populate("supplierName")
    .populate("items.group")
    .populate("items.subGroup")
    .populate("items.product");
};

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

  const allProductIds = Array.from(
    new Set([
      ...oldItems.map((i: any) => String(i.product)),
      ...newItems.map((i: any) => String(i.product)),
    ])
  );

  const inventories = await InventoryModel.find({ product: { $in: allProductIds } });
  const inventoryMap = new Map(inventories.map((inv) => [String(inv.product), inv]));

  const inventoriesToSave: any[] = [];

  if (currentStatus === "On Transit" && newStatus === "On Transit") {
    const oldMap = new Map<string, number>();
    oldItems.forEach((i: any) => oldMap.set(String(i.product), (oldMap.get(String(i.product)) || 0) + Number(i.orderQuantity || 0)));

    const newMap = new Map<string, number>();
    newItems.forEach((i: any) => newMap.set(String(i.product), (newMap.get(String(i.product)) || 0) + Number(i.orderQuantity || 0)));

    for (const prodId of allProductIds) {
      const oldQty = oldMap.get(prodId) || 0;
      const newQty = newMap.get(prodId) || 0;
      const diff = newQty - oldQty;

      if (diff !== 0) {
        let inventory = inventoryMap.get(prodId);
        const sample = [...oldItems, ...newItems].find((i: any) => String(i.product) === prodId);

        if (!inventory) {
          inventory = new InventoryModel({
            product: prodId,
            group: sample?.group || null,
            subGroup: sample?.subGroup || null,
            totalStock: 0,
            currentStock: 0,
            onTransit: 0,
            avgBuyingPrice: 0,
            totalStockValue: 0,
          });
          inventoryMap.set(prodId, inventory);
        } else {
          if (!inventory.group && sample?.group) inventory.group = sample.group;
          if (!inventory.subGroup && sample?.subGroup) inventory.subGroup = sample.subGroup;
        }
        inventory.onTransit = Math.max(0, inventory.onTransit + diff);
        inventoriesToSave.push(inventory);
      }
    }
  } else if (currentStatus === "Ordered" && newStatus === "On Transit") {
    for (const item of newItems) {
      const prodId = String(item.product);
      let inventory = inventoryMap.get(prodId);

      if (!inventory) {
        inventory = new InventoryModel({
          product: item.product,
          group: item.group || null,
          subGroup: item.subGroup || null,
          totalStock: 0,
          currentStock: 0,
          onTransit: 0,
          avgBuyingPrice: 0,
          totalStockValue: 0,
        });
        inventoryMap.set(prodId, inventory);
      } else {
        if (!inventory.group && item.group) inventory.group = item.group;
        if (!inventory.subGroup && item.subGroup) inventory.subGroup = item.subGroup;
      }
      inventory.onTransit += Number(item.orderQuantity || 0);
      inventoriesToSave.push(inventory);
    }
  } else if (newStatus === "Received") {
    if (currentStatus === "On Transit") {
      for (const item of oldItems) {
        const prodId = String(item.product);
        const inventory = inventoryMap.get(prodId);
        if (inventory) {
          inventory.onTransit = Math.max(0, inventory.onTransit - Number(item.orderQuantity || 0));
          inventoriesToSave.push(inventory);
        }
      }
    }

    for (const item of newItems) {
      const prodId = String(item.product);
      let inventory = inventoryMap.get(prodId);

      if (!inventory) {
        inventory = new InventoryModel({
          product: item.product,
          group: item.group || null,
          subGroup: item.subGroup || null,
          totalStock: 0,
          currentStock: 0,
          onTransit: 0,
          avgBuyingPrice: 0,
          totalStockValue: 0,
        });
        inventoryMap.set(prodId, inventory);
      } else {
        if (!inventory.group && item.group) inventory.group = item.group;
        if (!inventory.subGroup && item.subGroup) inventory.subGroup = item.subGroup;
      }

      const orderQty = Number(item.orderQuantity || 0);
      inventory.currentStock += orderQty;
      inventory.totalStock += orderQty;

      const newTotalStockValue = inventory.totalStockValue + (orderQty * Number(item.unitCost || 0));
      inventory.totalStockValue = newTotalStockValue;
      inventory.avgBuyingPrice = inventory.totalStock > 0 ? newTotalStockValue / inventory.totalStock : 0;

      inventoriesToSave.push(inventory);
    }
  }

  if (inventoriesToSave.length > 0) {
    const uniqueInventories = Array.from(new Set(inventoriesToSave));
    await Promise.all(uniqueInventories.map((inv) => inv.save()));
  }

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

const deletePurchaseOrderFromDB = async (purchaseId: string) => {
  const existingOrder = await PurchaseOrderModel.findOne({ purchaseId });

  if (!existingOrder) {
    throw new Error("Purchase order not found!");
  }

  if (existingOrder.status === "On Transit") {
    const productIds = existingOrder.items.map((i: any) => i.product);
    const inventories = await InventoryModel.find({ product: { $in: productIds } });
    const inventoryMap = new Map(inventories.map((inv) => [String(inv.product), inv]));

    const inventoriesToSave = [];
    for (const item of existingOrder.items) {
      const inventory = inventoryMap.get(String(item.product));
      if (inventory) {
        inventory.onTransit = Math.max(0, inventory.onTransit - Number(item.orderQuantity || 0));
        inventoriesToSave.push(inventory);
      }
    }
    if (inventoriesToSave.length > 0) {
      await Promise.all(inventoriesToSave.map((inv) => inv.save()));
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