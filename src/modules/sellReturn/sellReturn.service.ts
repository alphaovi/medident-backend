import { ISellReturn } from "./sellReturn.interface.js";
import { SellReturnModel } from "./sellReturn.model.js";
import { InventoryModel } from "../inventory/inventory.model.js";

export class SellReturnService {
  /**
   * Create a new Sell Return record and automatically increment 
   * `sellReturn` and `currentStock` in Inventory.
   */
  public static async createSellReturn(payload: Partial<ISellReturn>): Promise<ISellReturn> {
    // 1. Create Sell Return record in Database
    const newSellReturn = await SellReturnModel.create(payload);

    // 2. Increment stock & sellReturn in Inventory for each returned item
    if (payload.products && payload.products.length > 0) {
      for (const item of payload.products) {
        await InventoryModel.findOneAndUpdate(
          { product: item.product },
          {
            $inc: {
              sellReturn: item.quantity,
              currentStock: item.quantity,
            },
          },
          { upsert: true, new: true }
        );
      }
    }

    return newSellReturn;
  }

  /**
   * Get all Sell Return records with populated references
   */
  public static async getAllSellReturns(): Promise<ISellReturn[]> {
    return await SellReturnModel.find()
      .populate("customer", "name customerName address office state")
      .populate("products.product", "name productName")
      .populate("products.group", "groupName name")
      .populate("products.subGroup", "subGroupName name")
      .sort({ createdAt: -1 });
  }

  /**
   * Get a single Sell Return record by ID
   */
  public static async getSellReturnById(id: string): Promise<ISellReturn | null> {
    return await SellReturnModel.findById(id)
      .populate("customer", "name customerName address office state")
      .populate("products.product", "name productName")
      .populate("products.group", "groupName name")
      .populate("products.subGroup", "subGroupName name");
  }

  /**
   * Delete a Sell Return record by ID
   */
  public static async deleteSellReturn(id: string): Promise<ISellReturn | null> {
    return await SellReturnModel.findByIdAndDelete(id);
  }
}