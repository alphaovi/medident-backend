import { ISellReturn } from "./sellReturn.interface.js";
import { SellReturnModel } from "./sellReturn.model.js";
import { InventoryModel } from "../inventory/inventory.model.js";
import mongoose from "mongoose";

export class SellReturnService {
  public static async createSellReturn(payload: Partial<ISellReturn>): Promise<ISellReturn> {
    const newSellReturn = await SellReturnModel.create(payload);

    // 🟢 সেল রিটার্ন তৈরি হলে ইনভেন্টরির sellReturn বাড়বে এবং pre-save হুক ট্রিগার হয়ে currentStock আপডেট হবে
    if (newSellReturn.products && newSellReturn.products.length > 0) {
      for (const item of newSellReturn.products) {
        let rawProdId = item.product;
        if (typeof rawProdId === "object" && rawProdId !== null) {
          rawProdId = (rawProdId as any)._id || (rawProdId as any).id;
        }
        if (!rawProdId) continue;

        const mongoProdId = new mongoose.Types.ObjectId(rawProdId.toString().trim());

        // ইনভেন্টরি খুঁজে বের করা অথবা না থাকলে ইনিশিয়ালাইজ করা
        let inventory = await InventoryModel.findOne({ product: mongoProdId });
        
        if (!inventory) {
          inventory = new InventoryModel({
            product: mongoProdId,
            totalStock: 0,
            purchaseReturn: 0,
            sellReturn: 0,
            totalSell: 0,
            damaged: 0,
            lost: 0,
            freeSample: 0,
            currentStock: 0,
          });
        }
        
        const returnQty = Number(item.quantity || 0);
        inventory.sellReturn = (Number(inventory.sellReturn) || 0) + returnQty;
        
        await inventory.save(); // এটি আপনার প্রি-সেভ হুক ট্রিগার করবে
      }
    }

    return newSellReturn;
  }

  public static async getAllSellReturns(): Promise<ISellReturn[]> {
    return await SellReturnModel.find()
      .populate("customer", "name customerName address office state")
      .populate("products.product", "name productName")
      .populate("products.group", "groupName name")
      .populate("products.subGroup", "subGroupName name")
      .sort({ createdAt: -1 });
  }

  public static async getSellReturnById(id: string): Promise<ISellReturn | null> {
    return await SellReturnModel.findById(id)
      .populate("customer", "name customerName address office state")
      .populate("products.product", "name productName")
      .populate("products.group", "groupName name")
      .populate("products.subGroup", "subGroupName name");
  }

  public static async updateSellReturn(id: string, payload: Partial<ISellReturn>): Promise<ISellReturn | null> {
    const existingReturn = await SellReturnModel.findById(id);
    if (!existingReturn) return null;

    // ১. আপডেট করার আগে পুরানো রিটার্ন কোয়ান্টিটি ইনভেন্টরি থেকে মাইনাস করে রিভার্ট করা
    if (existingReturn.products && existingReturn.products.length > 0) {
      for (const oldItem of existingReturn.products) {
        let rawProdId = oldItem.product;
        if (typeof rawProdId === "object" && rawProdId !== null) {
          rawProdId = (rawProdId as any)._id || (rawProdId as any).id;
        }
        if (!rawProdId) continue;

        const mongoProdId = new mongoose.Types.ObjectId(rawProdId.toString().trim());
        const inventory = await InventoryModel.findOne({ product: mongoProdId });

        if (inventory) {
          const oldQty = Number(oldItem.quantity || 0);
          inventory.sellReturn = Math.max(0, (Number(inventory.sellReturn) || 0) - oldQty);
          await inventory.save();
        }
      }
    }

    // ২. সেল রিটার্ন ডকুমেন্ট আপডেট করা
    const updatedReturn = await SellReturnModel.findByIdAndUpdate(id, payload, { 
      new: true, 
      runValidators: true 
    });

    // ৩. নতুন আপডেট হওয়া কোয়ান্টিটি ইনভেন্টরিতে যোগ করা
    if (updatedReturn && updatedReturn.products && updatedReturn.products.length > 0) {
      for (const newItem of updatedReturn.products) {
        let rawProdId = newItem.product;
        if (typeof rawProdId === "object" && rawProdId !== null) {
          rawProdId = (rawProdId as any)._id || (rawProdId as any).id;
        }
        if (!rawProdId) continue;

        const mongoProdId = new mongoose.Types.ObjectId(rawProdId.toString().trim());
        let inventory = await InventoryModel.findOne({ product: mongoProdId });

        if (!inventory) {
          inventory = new InventoryModel({
            product: mongoProdId,
            totalStock: 0,
            purchaseReturn: 0,
            sellReturn: 0,
            totalSell: 0,
            damaged: 0,
            lost: 0,
            freeSample: 0,
            currentStock: 0,
          });
        }

        const newQty = Number(newItem.quantity || 0);
        inventory.sellReturn = (Number(inventory.sellReturn) || 0) + newQty;
        await inventory.save();
      }
    }

    return updatedReturn;
  }

  public static async deleteSellReturn(id: string): Promise<ISellReturn | null> {
    const deletedReturn = await SellReturnModel.findByIdAndDelete(id);

    // ৪. সেল রিটার্ন ডিলিট হয়ে গেলে ইনভেন্টরির sellReturn কমিয়ে দেওয়া
    if (deletedReturn && deletedReturn.products && deletedReturn.products.length > 0) {
      for (const item of deletedReturn.products) {
        let rawProdId = item.product;
        if (typeof rawProdId === "object" && rawProdId !== null) {
          rawProdId = (rawProdId as any)._id || (rawProdId as any).id;
        }
        if (!rawProdId) continue;

        const mongoProdId = new mongoose.Types.ObjectId(rawProdId.toString().trim());
        const inventory = await InventoryModel.findOne({ product: mongoProdId });

        if (inventory) {
          const qty = Number(item.quantity || 0);
          inventory.sellReturn = Math.max(0, (Number(inventory.sellReturn) || 0) - qty);
          await inventory.save();
        }
      }
    }

    return deletedReturn;
  }
}