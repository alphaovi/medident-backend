import { PurchaseOrderModel } from "./purchaseOrder.model.js";

// 1. Create Purchase Order
const createPurchaseOrderIntoDB = async (payload: any) => {
  const result = await PurchaseOrderModel.create(payload);
  return result;
};

// 2. Get All Purchase Orders
const getAllPurchaseOrdersFromDB = async () => {
  const result = await PurchaseOrderModel.find();
  return result;
};

// 3. Get Single Purchase Order by purchaseId
const getSinglePurchaseOrderFromDB = async (purchaseId: string) => {
  const result = await PurchaseOrderModel.findOne({ purchaseId: purchaseId });
  return result;
};

// 4. Update Purchase Order by purchaseId with restrictions
const updatePurchaseOrderInDB = async (purchaseId: string, payload: any) => {
  // Pehle existing purchase order ko find karein
  const existingOrder = await PurchaseOrderModel.findOne({ purchaseId });

  if (!existingOrder) {
    throw new Error("Purchase order not found!");
  }

  const currentStatus = existingOrder.status;
  const newStatus = payload.status;

  // Rule A: Agar status already "On Transit" ya "Received" ho chuka hai, toh poora order edit nahi kiya ja sakta
  // (Lekin agar aap chahte hain ki sirf status change allow ho ya kuch specific fields, toh condition adjust ki ja sakti hai)
  if (currentStatus === "Received") {
    throw new Error("This purchase order has already been received and cannot be edited!");
  }

  if (currentStatus === "On Transit" && newStatus && newStatus !== "Received") {
    throw new Error("Order is already 'On Transit'. You can only move it forward to 'Received', not edit other fields or go back!");
  }

  // Rule B: Backward status transition check
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

  const result = await PurchaseOrderModel.findOneAndUpdate(
    { purchaseId: purchaseId },
    payload,
    {
      new: true,
      runValidators: true,
    }
  );
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