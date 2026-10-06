import mongoose from "mongoose";
import { PurchaseOrder } from "./purchaseOrder.interface.js";
import { PurchaseOrderModel } from "./purchaseOrder.model.js";
import { InventoryModel } from "../inventory/inventory.model.js";
import { ProductModel } from "../product/product.model.js";

// ১. পারচেজ অর্ডার ক্রিয়েট (Ordered স্ট্যাটাসে শুধু PO তৈরি হবে, ইনভেন্টরি হাত দেওয়া হবে না)
const createPurchaseOrderIntoDB = async (payload: PurchaseOrder) => {
  if (payload.status && payload.status !== "Ordered") {
    throw new Error("A new purchase order must start with 'Ordered' status. You cannot create directly as On Transit or Received.");
  }

  payload.status = "Ordered";

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    for (const item of payload.items) {
      const existingProduct = await ProductModel.findById(item.product).session(session);
      if (!existingProduct) {
        throw new Error(`Product with ID ${item.product} does not exist! Please create the product first.`);
      }
    }

    // শুধু PO তৈরি হবে, ইনভেন্টরিতে কোনো চেঞ্জ হবে না
    const createdPO = await PurchaseOrderModel.create([payload], { session });
    const po = createdPO[0];

    await session.commitTransaction();
    session.endSession();

    return po;
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

const getAllPurchaseOrdersFromDB = async () => {
  return await PurchaseOrderModel.find()
    .populate("supplierName")
    .populate("items.product")
    .populate("items.group")
    .populate("items.subGroup");
};

const getSinglePurchaseOrderFromDB = async (purchaseId: string) => {
  return await PurchaseOrderModel.findOne({ purchaseId })
    .populate("supplierName")
    .populate("items.product")
    .populate("items.group")
    .populate("items.subGroup");
};

// ২. পারচেজ অর্ডার আপডেট এবং স্ট্যাটাস চেঞ্জ লজিক (Ordered ➔ On Transit ➔ Received)
const updatePurchaseOrderInDB = async (purchaseId: string, payload: Partial<PurchaseOrder>) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const existingPO = await PurchaseOrderModel.findOne({ purchaseId }).session(session);
    if (!existingPO) {
      throw new Error("Purchase Order not found!");
    }

    const oldStatus = existingPO.status;
    const newStatus = payload.status || oldStatus;

    // ----------------------------------------------------
    // সিনারিও ১: Ordered থেকে যখন "On Transit" করা হবে
    // ----------------------------------------------------
    if (oldStatus === "Ordered" && newStatus === "On Transit") {
      for (const item of existingPO.items) {
        let inventory = await InventoryModel.findOne({ product: item.product }).session(session);

        if (!inventory) {
          const productData = await ProductModel.findById(item.product).session(session);
          const initialStock = productData?.stock || 0;
          const purchasePrice = productData?.purchasePrice || 0;

          await InventoryModel.create(
            [
              {
                product: item.product,
                group: item.group,
                subGroup: item.subGroup,
                totalStock: initialStock,
                currentStock: initialStock,
                onTransit: item.orderQuantity, // ট্রানজিটে যোগ হলো
                totalSell: 0,
                avgBuyingPrice: purchasePrice,
                totalStockValue: initialStock * purchasePrice,
                totalSaleValue: 0,
              },
            ],
            { session }
          );
        } else {
          await InventoryModel.findOneAndUpdate(
            { product: item.product },
            { $inc: { onTransit: item.orderQuantity } }, // ট্রানজিটে যোগ হলো
            { session }
          );
        }
      }
    }

    // ----------------------------------------------------
    // সিনারিও ২: On Transit বা Ordered থেকে সরাসরি যখন "Received" করা হবে
    // ----------------------------------------------------
    else if (oldStatus !== "Received" && newStatus === "Received") {
      for (const item of existingPO.items) {
        let inventory = await InventoryModel.findOne({ product: item.product }).session(session);

        if (!inventory) {
          const productData = await ProductModel.findById(item.product).session(session);
          const initialStock = productData?.stock || 0;
          const purchasePrice = productData?.purchasePrice || 0;

          inventory = await InventoryModel.create(
            [
              {
                product: item.product,
                group: item.group,
                subGroup: item.subGroup,
                totalStock: initialStock,
                currentStock: initialStock,
                onTransit: 0,
                totalSell: 0,
                avgBuyingPrice: purchasePrice,
                totalStockValue: initialStock * purchasePrice,
                totalSaleValue: 0,
              },
            ],
            { session }
          );
          inventory = inventory[0];
        }

        const currentStock = inventory.currentStock || 0;
        const onTransit = inventory.onTransit || 0;
        const totalStock = inventory.totalStock || 0;
        const avgBuyingPrice = inventory.avgBuyingPrice || 0;

        const newQty = item.orderQuantity;
        const itemUnitCost = item.unitCost;

        // Weighted Average Buying Price হিসাব
        const totalOldValue = currentStock * avgBuyingPrice;
        const totalNewValue = newQty * itemUnitCost;
        const updatedTotalStock = currentStock + newQty;
        const updatedAvgBuyingPrice = updatedTotalStock > 0 ? (totalOldValue + totalNewValue) / updatedTotalStock : itemUnitCost;

        // যদি আগে অন-ট্রানজিটে থাকে তবে ট্রানজিট থেকে কমবে, নতুবা ট্রানজিট জিরোই থাকবে
        const deductedTransit = oldStatus === "On Transit" ? Math.max(0, onTransit - newQty) : onTransit;

        await InventoryModel.findOneAndUpdate(
          { product: item.product },
          {
            $set: {
              currentStock: updatedTotalStock,
              totalStock: totalStock + newQty,
              onTransit: deductedTransit,
              avgBuyingPrice: Number(updatedAvgBuyingPrice.toFixed(2)),
              totalStockValue: Number((updatedTotalStock * updatedAvgBuyingPrice).toFixed(2)),
            },
          },
          { session }
        );
      }
    }

    // ----------------------------------------------------
    // সিনারিও ৩: ভুলবশত "Received" থেকে স্ট্যাটাস পরিবর্তন করে পেছনে (On Transit বা Ordered) নেওয়া হলে
    // ----------------------------------------------------
    else if (oldStatus === "Received" && newStatus !== "Received") {
      for (const item of existingPO.items) {
        const inventory = await InventoryModel.findOne({ product: item.product }).session(session);

        if (inventory) {
          const currentStock = inventory.currentStock || 0;
          const onTransit = inventory.onTransit || 0;
          const totalStock = inventory.totalStock || 0;
          const newQty = item.orderQuantity;

          const updatedCurrentStock = Math.max(0, currentStock - newQty);
          const updatedTotalStock = Math.max(0, totalStock - newQty);
          const updatedTransit = newStatus === "On Transit" ? onTransit + newQty : onTransit;

          await InventoryModel.findOneAndUpdate(
            { product: item.product },
            {
              $set: {
                currentStock: updatedCurrentStock,
                totalStock: updatedTotalStock,
                onTransit: updatedTransit,
                totalStockValue: Number((updatedCurrentStock * inventory.avgBuyingPrice).toFixed(2)),
              },
            },
            { session }
          );
        }
      }
    }

    // PO আপডেট করা (এখানে new: true এর বদলে returnDocument: 'after' দেওয়া হয়েছে)
    const updatedPO = await PurchaseOrderModel.findOneAndUpdate(
      { purchaseId },
      payload,
      { returnDocument: 'after', runValidators: true, session }
    );

    await session.commitTransaction();
    session.endSession();

    return updatedPO;
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

export const PurchaseOrderServices = {
  createPurchaseOrderIntoDB,
  getAllPurchaseOrdersFromDB,
  getSinglePurchaseOrderFromDB,
  updatePurchaseOrderInDB,
};