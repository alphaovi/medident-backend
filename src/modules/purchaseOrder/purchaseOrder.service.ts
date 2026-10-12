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

// 4. Update Purchase Order by purchaseId
const updatePurchaseOrderInDB = async (purchaseId: string, payload: any) => {
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