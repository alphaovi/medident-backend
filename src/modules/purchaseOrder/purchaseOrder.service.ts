import { PurchaseOrderModel } from "./purchaseOrder.model.js";
// Apnar product model jekhan theke ase oikhane import kore neben:
// import { ProductModel } from "../product/product.model.js";

// 1. Create Purchase Order
const createPurchaseOrderIntoDB = async (payload: any) => {
  // Jodi create korar samay status "On Transit" thake, tahoke inventory te inTransit barate hobe
  const result = await PurchaseOrderModel.create(payload);
  
  if (result.status === "On Transit") {
    for (const item of result.items) {
      // Product Model update example (uncomment and adjust according to your Product schema)
      /*
      await ProductModel.findByIdAndUpdate(item.product, {
        $inc: { inTransit: item.orderQuantity }
      });
      */
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

// 4. Update Purchase Order & Handle Inventory (On Transit -> Received flow)
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

  // Inventory logic handle korchi status change er upor ভিত্তি kore:
  if (newStatus && currentStatus !== newStatus) {
    for (const item of existingOrder.items) {
      if (newStatus === "On Transit") {
        // Ordered -> On Transit: Inventory te inTransit barbe
        /*
        await ProductModel.findByIdAndUpdate(item.product, {
          $inc: { inTransit: item.orderQuantity }
        });
        */
      } else if (newStatus === "Received") {
        // On Transit (or Ordered) -> Received: inTransit theke minus hobe, currentStock a add hobe
        /*
        await ProductModel.findByIdAndUpdate(item.product, {
          $inc: { 
            inTransit: -item.orderQuantity, 
            currentStock: item.orderQuantity 
          }
        });
        */
      }
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