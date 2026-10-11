

// 1. Create Purchase Order
const createPurchaseOrderIntoDB = async (payload: any) => {
  const result = await PurchaseOrderModel.create(payload);
  return result;
};

// 2. Get All Purchase Orders
const getAllPurchaseOrdersFromDB = async () => {
  const result = await PurchaseOrder.find();
  return result;
};

// 3. Get Single Purchase Order by purchaseId
const getSinglePurchaseOrderFromDB = async (purchaseId: string) => {
  const result = await PurchaseOrder.findOne({ purchaseId: purchaseId });
  return result;
};

// 4. Update Purchase Order by purchaseId (Fixed for 500 Error)
const updatePurchaseOrderInDB = async (purchaseId: string, payload: any) => {
  const result = await PurchaseOrder.findOneAndUpdate(
    { purchaseId: purchaseId }, // MongoDB er _id er bodole custom purchaseId diye khujbe
    payload,
    {
      new: true,
      runValidators: true,
    }
  );
  return result;
};

// 5. Delete Purchase Order by purchaseId (Optional, jodi dorkar hoy)
const deletePurchaseOrderFromDB = async (purchaseId: string) => {
  const result = await PurchaseOrder.findOneAndDelete({ purchaseId: purchaseId });
  return result;
};

export const PurchaseOrderServices = {
  createPurchaseOrderIntoDB,
  getAllPurchaseOrdersFromDB,
  getSinglePurchaseOrderFromDB,
  updatePurchaseOrderInDB,
  deletePurchaseOrderFromDB,
};