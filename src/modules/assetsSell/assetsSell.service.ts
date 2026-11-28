import mongoose from "mongoose";
import { IAssetSellItem, IAssetsSell } from "./assetsSell.interface.js";
import { AssetsSell } from "./assetsSell.model.js";
import { Assets } from "../assets/assets.model.js";
import { AssetsService } from "../assets/assets.service.js";
import { UserModel } from "../user/user.model.js";
import { BanksDetailModel } from "../banksDetail/banksDetail.model.js";
import { BanksDetailServices } from "../banksDetail/banksDetail.service.js";

const round2 = (num: number): number => Number(num.toFixed(2));

const populateSellQuery = (query: any) =>
  query.populate([
    { path: "assetsGroup", select: "groupName" },
    { path: "assetsSubGroup", select: "subGroupName groupId" },
    { path: "receivedBy", select: "name email role phone" },
    { path: "depositToBank", select: "bankName accountNo accountName currentBalance user" },
  ]);

const generateInvoiceNo = async (): Promise<string> => {
  const count = await AssetsSell.countDocuments();
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `AS-INV-${datePart}-${String(count + 1).padStart(4, "0")}`;
};

const createAssetSellIntoDB = async (payload: IAssetsSell) => {
  // 1. Validate User & User's Bank Account (if provided)
  if (payload.receivedBy && payload.depositToBank) {
    if (
      !mongoose.isValidObjectId(String(payload.receivedBy)) ||
      !mongoose.isValidObjectId(String(payload.depositToBank))
    ) {
      throw new Error("Invalid User or Bank Account ID");
    }

    const userDoc = await UserModel.findById(payload.receivedBy).select("_id");
    if (!userDoc) throw new Error("Selected user does not exist");

    const bankDoc = await BanksDetailModel.findById(payload.depositToBank);
    if (!bankDoc) throw new Error("Selected bank/cash account does not exist");

    const bankOwnerId =
      typeof bankDoc.user === "object" && bankDoc.user !== null && "_id" in bankDoc.user
        ? String((bankDoc.user as any)._id)
        : String(bankDoc.user);

    if (bankOwnerId !== String(userDoc._id)) {
      throw new Error("Selected bank account does not belong to the selected user");
    }
  } else if (payload.depositToBank) {
    const bankDoc = await BanksDetailModel.findById(payload.depositToBank);
    if (!bankDoc) throw new Error("Selected bank/cash account does not exist");
  }

  let totalSoldQuantity = 0;
  let grandTotalSellAmount = 0;
  let grandPurchaseCostForSold = 0;
  let grandBookValueForSold = 0;
  let grandProfitOrLoss = 0;

  const processedSoldItems: IAssetSellItem[] = [];
  const stockUpdates: Array<{ recordId: string; itemId: string; sellQuantity: number }> = [];

  // 2. Calculate each soldItem with current depreciation/book value from Assets collection
  for (const rawItem of payload.soldItems || []) {
    const assetRecord = await AssetsService.getSingleAssetByIdFromDB(
      String(rawItem.assetsRecordId)
    );
    if (!assetRecord) {
      throw new Error(`Assets record not found for ID: ${rawItem.assetsRecordId}`);
    }

    const targetItem = (assetRecord.assets || []).find(
      (it: any) => String(it._id) === String(rawItem.assetItemId)
    );
    if (!targetItem) {
      throw new Error(`Asset item not found for ID: ${rawItem.assetItemId}`);
    }

    const sellQuantity = Math.max(1, Number(rawItem.sellQuantity || 1));
    if (sellQuantity > Number(targetItem.quantity || 0)) {
      throw new Error(
        `Insufficient stock for "${targetItem.assetName}". Available: ${targetItem.quantity}, Requested: ${sellQuantity}`
      );
    }

    const sellPrice = Math.max(0, Number(rawItem.sellPrice || 0));
    const purchaseUnitPrice = round2(Number(targetItem.unitPrice || 0));
    const currentBookValuePerUnit = round2(
      Number(targetItem.quantity) > 0
        ? Number(targetItem.remainingDepreciableAmount ?? targetItem.totalCost ?? 0) /
            Number(targetItem.quantity)
        : 0
    );

    const totalSellAmount = round2(sellQuantity * sellPrice);
    const purchaseCostForSold = round2(sellQuantity * purchaseUnitPrice);
    const bookValueForSold = round2(sellQuantity * currentBookValuePerUnit);
    const profitOrLoss = round2(totalSellAmount - bookValueForSold);

    totalSoldQuantity += sellQuantity;
    grandTotalSellAmount += totalSellAmount;
    grandPurchaseCostForSold += purchaseCostForSold;
    grandBookValueForSold += bookValueForSold;
    grandProfitOrLoss += profitOrLoss;

    processedSoldItems.push({
      assetsRecordId: rawItem.assetsRecordId,
      assetItemId: rawItem.assetItemId,
      sellQuantity,
      sellPrice,
      purchaseUnitPrice,
      currentBookValuePerUnit,
      totalSellAmount,
      purchaseCostForSold,
      bookValueForSold,
      profitOrLoss,
      notes: rawItem.notes?.trim() || "",
    });

    stockUpdates.push({
      recordId: String(rawItem.assetsRecordId),
      itemId: String(rawItem.assetItemId),
      sellQuantity,
    });
  }

  const invoiceNo = payload.invoiceNo?.trim() || (await generateInvoiceNo());
  const sellDate = payload.sellDate ? new Date(payload.sellDate) : new Date();

  // 3. Create record in AssetsSell collection
  const created = await AssetsSell.create({
    invoiceNo,
    sellDate,
    assetsGroup: payload.assetsGroup,
    assetsSubGroup: payload.assetsSubGroup,
    receivedBy: payload.receivedBy || null,
    depositToBank: payload.depositToBank || null,
    customerName: payload.customerName?.trim() || "",
    customerPhone: payload.customerPhone?.trim() || "",
    soldItems: processedSoldItems,
    totalSoldQuantity,
    grandTotalSellAmount: round2(grandTotalSellAmount),
    grandPurchaseCostForSold: round2(grandPurchaseCostForSold),
    grandBookValueForSold: round2(grandBookValueForSold),
    grandProfitOrLoss: round2(grandProfitOrLoss),
    notes: payload.notes?.trim() || "",
  });

  // 4. Update stock in Assets collection (reduce quantity or remove item/record)
  for (const upd of stockUpdates) {
    const doc = await Assets.findById(upd.recordId);
    if (!doc) continue;

    const updatedAssets = doc.assets
      .map((it: any) =>
        String(it._id) === upd.itemId
          ? { ...it.toObject(), quantity: Number(it.quantity) - upd.sellQuantity }
          : it.toObject()
      )
      .filter((it: any) => Number(it.quantity) > 0);

    if (updatedAssets.length === 0) {
      await Assets.findByIdAndDelete(upd.recordId);
    } else {
      await AssetsService.updateAssetsIntoDB(upd.recordId, {
        assets: updatedAssets,
      });
    }
  }

  // 5. Add sold amount (+) into selected depositToBank account & record in bank transactions
  if (payload.depositToBank && grandTotalSellAmount > 0) {
    await BanksDetailServices.recordAssetSellDepositIntoBank({
      bankId: payload.depositToBank,
      amount: round2(grandTotalSellAmount),
      date: sellDate,
      referenceId: created._id,
      note: `Asset Sell (${invoiceNo})${
        payload.customerName ? ` - Customer: ${payload.customerName}` : ""
      }`,
    });
  }

  return await populateSellQuery(AssetsSell.findById(created._id));
};

const getAllAssetSellsFromDB = async (query: Record<string, unknown> = {}) => {
  const filter: Record<string, unknown> = {};

  if (typeof query.receivedBy === "string" && query.receivedBy.trim()) {
    filter.receivedBy = query.receivedBy.trim();
  }
  if (typeof query.depositToBank === "string" && query.depositToBank.trim()) {
    filter.depositToBank = query.depositToBank.trim();
  }
  if (typeof query.assetsGroup === "string" && query.assetsGroup.trim()) {
    filter.assetsGroup = query.assetsGroup.trim();
  }
  if (typeof query.assetsSubGroup === "string" && query.assetsSubGroup.trim()) {
    filter.assetsSubGroup = query.assetsSubGroup.trim();
  }

  return await populateSellQuery(
    AssetsSell.find(filter).sort({ sellDate: -1, createdAt: -1 })
  );
};

const getSingleAssetSellByIdFromDB = async (id: string) => {
  return await populateSellQuery(AssetsSell.findById(id));
};

const deleteAssetSellFromDB = async (id: string) => {
  const existing = await AssetsSell.findById(id);
  if (!existing) return null;

  if (existing.depositToBank && Number(existing.grandTotalSellAmount) > 0) {
    await BanksDetailServices.recordAssetPurchaseOutFromBank({
      bankId: existing.depositToBank,
      amount: Number(existing.grandTotalSellAmount),
      date: new Date(),
      referenceId: existing._id,
      note: `Deleted asset sell reversal (${existing.invoiceNo || existing._id})`,
    });
  }

  return await AssetsSell.findByIdAndDelete(id);
};

export const AssetsSellService = {
  createAssetSellIntoDB,
  getAllAssetSellsFromDB,
  getSingleAssetSellByIdFromDB,
  deleteAssetSellFromDB,
};