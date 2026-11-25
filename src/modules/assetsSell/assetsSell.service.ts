import { Types } from "mongoose";
import { Assets } from "../assets/assets.model.js";
import { AssetsGroup } from "../assetsGroup/assetsGroup.model.js";
import { AssetsSubGroup } from "../assetsSubGroup/assetsSubGroup.model.js";
import { IAssetSellItem, IAssetsSell } from "./assetsSell.interface.js";
import { AssetsSell } from "./assetsSell.model.js";
import { BanksDetailModel } from "../banksDetail/banksDetail.model.js";

const round2 = (num: number): number => Number(num.toFixed(2));

// Group ও SubGroup অনুযায়ী বিক্রয়যোগ্য Asset প্রোডাক্টের বিস্তারিত লিস্ট আনা
const getSelectableAssetsByGroupAndSubGroupFromDB = async (
  assetsGroupId: string,
  assetsSubGroupId: string
) => {
  const records = await Assets.find({
    assetsGroup: assetsGroupId,
    assetsSubGroup: assetsSubGroupId,
  }).populate([
    { path: "assetsGroup", select: "groupName" },
    { path: "assetsSubGroup", select: "subGroupName groupId" },
  ]);

  const pastSells = await AssetsSell.find({
    assetsGroup: assetsGroupId,
    assetsSubGroup: assetsSubGroupId,
  });

  const soldQtyMap = new Map<string, number>();
  for (const sellDoc of pastSells) {
    for (const sItem of sellDoc.soldItems || []) {
      const key = `${String(sItem.assetsRecordId)}_${String(sItem.assetItemId)}`;
      soldQtyMap.set(
        key,
        (soldQtyMap.get(key) || 0) + Number(sItem.sellQuantity || 0)
      );
    }
  }

  return records.flatMap((record: any) =>
    (record.assets || []).map((item: any) => {
      const key = `${String(record._id)}_${String(item._id)}`;
      const purchasedQuantity = Number(item.quantity || 0);
      const soldQuantity = soldQtyMap.get(key) || 0;
      const availableQuantity = Math.max(0, purchasedQuantity - soldQuantity);

      const purchaseUnitPrice = Number(item.unitPrice || 0);
      const totalPurchaseCost = round2(purchasedQuantity * purchaseUnitPrice);
      const remainingBookValue = Number(
        item.remainingDepreciableAmount ??
          item.netPurchaseCost ??
          totalPurchaseCost
      );
      const currentBookValuePerUnit =
        purchasedQuantity > 0
          ? round2(remainingBookValue / purchasedQuantity)
          : purchaseUnitPrice;

      return {
        assetsRecordId: record._id,
        assetItemId: item._id,
        assetsGroup: record.assetsGroup,
        assetsSubGroup: record.assetsSubGroup,
        assetName: item.assetName,
        assetCode: item.assetCode || "",
        purchaseDate: item.purchaseDate,
        purchasedQuantity, // কয়টা কেনা হয়েছিল
        soldQuantity, // কতটা বিক্রি হয়েছে
        availableQuantity, // এখন কয়টা বিক্রি করা যাবে
        purchaseUnitPrice, // কেনার ইউনিট প্রাইস
        totalPurchaseCost, // মোট কেনা দাম
        depreciationPeriod: item.depreciationPeriod,
        depreciationMode: item.depreciationMode,
        depreciationValue: item.depreciationValue,
        depreciatedAmount: item.depreciatedAmount || 0,
        remainingDepreciableAmount: remainingBookValue,
        currentBookValuePerUnit,
      };
    })
  );
};

// নতুন Asset Sell তৈরি করা
const createAssetsSellIntoDB = async (payload: IAssetsSell) => {
  const group = await AssetsGroup.findById(payload.assetsGroup);
  if (!group) {
    throw new Error("Referenced Asset Group does not exist");
  }

  const subGroup = await AssetsSubGroup.findById(payload.assetsSubGroup);
  if (!subGroup) {
    throw new Error("Referenced Asset Sub-Group does not exist");
  }

  if (String(subGroup.groupId) !== String(group._id)) {
    throw new Error(
      "Selected Asset Sub-Group does not belong to the selected Asset Group"
    );
  }

  const availableList = await getSelectableAssetsByGroupAndSubGroupFromDB(
    String(payload.assetsGroup),
    String(payload.assetsSubGroup)
  );

  const availableMap = new Map(
    availableList.map((entry) => [
      `${String(entry.assetsRecordId)}_${String(entry.assetItemId)}`,
      entry,
    ])
  );

  let totalSoldQuantity = 0;
  let grandTotalSellAmount = 0;
  let grandPurchaseCostForSold = 0;
  let grandBookValueForSold = 0;
  let grandProfitOrLoss = 0;

  const processedItems: IAssetSellItem[] = (payload.soldItems || []).map(
    (item) => {
      const key = `${String(item.assetsRecordId)}_${String(item.assetItemId)}`;
      const matched = availableMap.get(key);

      if (!matched) {
        throw new Error(
          `Asset item (${item.assetItemId}) not found under selected Group & SubGroup`
        );
      }

      const sellQuantity = Math.max(1, Number(item.sellQuantity || 0));
      if (sellQuantity > matched.availableQuantity) {
        throw new Error(
          `Insufficient available quantity for "${matched.assetName}". Available: ${matched.availableQuantity}, Requested: ${sellQuantity}`
        );
      }

      const sellPrice = Math.max(0, Number(item.sellPrice || 0));
      const totalSellAmount = round2(sellQuantity * sellPrice);
      const purchaseCostForSold = round2(
        sellQuantity * matched.purchaseUnitPrice
      );
      const bookValueForSold = round2(
        sellQuantity * matched.currentBookValuePerUnit
      );
      const profitOrLoss = round2(totalSellAmount - bookValueForSold);

      totalSoldQuantity += sellQuantity;
      grandTotalSellAmount += totalSellAmount;
      grandPurchaseCostForSold += purchaseCostForSold;
      grandBookValueForSold += bookValueForSold;
      grandProfitOrLoss += profitOrLoss;

      return {
        assetsRecordId: new Types.ObjectId(String(item.assetsRecordId)),
        assetItemId: new Types.ObjectId(String(item.assetItemId)),
        sellQuantity,
        sellPrice,
        purchaseUnitPrice: matched.purchaseUnitPrice,
        currentBookValuePerUnit: matched.currentBookValuePerUnit,
        totalSellAmount,
        purchaseCostForSold,
        bookValueForSold,
        profitOrLoss,
        notes: item.notes || "",
      };
    }
  );

  const sellDate = payload.sellDate ? new Date(payload.sellDate) : new Date();

  // চাইলে ব্যাংক অ্যাকাউন্টে বিক্রির টাকা জমা করা যাবে
  if (payload.depositToBank && grandTotalSellAmount > 0) {
    await BanksDetailModel.findByIdAndUpdate(payload.depositToBank, {
      $inc: { currentBalance: grandTotalSellAmount },
      $push: {
        transactions: {
          bankAccount: payload.depositToBank,
          type: "deposit",
          direction: "in",
          amount: grandTotalSellAmount,
          date: sellDate,
          note: payload.notes || "Asset Sale Deposit",
        },
      },
    });
  }

  const created = await AssetsSell.create({
    sellDate,
    assetsGroup: payload.assetsGroup,
    assetsSubGroup: payload.assetsSubGroup,
    depositToBank: payload.depositToBank || null,
    customerName: payload.customerName || "",
    customerPhone: payload.customerPhone || "",
    soldItems: processedItems,
    totalSoldQuantity,
    grandTotalSellAmount: round2(grandTotalSellAmount),
    grandPurchaseCostForSold: round2(grandPurchaseCostForSold),
    grandBookValueForSold: round2(grandBookValueForSold),
    grandProfitOrLoss: round2(grandProfitOrLoss),
    notes: payload.notes || "",
  });

  return await created.populate([
    { path: "assetsGroup", select: "groupName" },
    { path: "assetsSubGroup", select: "subGroupName groupId" },
    {
      path: "depositToBank",
      select: "bankName accountName accountNo currentBalance",
    },
  ]);
};

// সব Asset Sell রেকর্ড আনা
const getAllAssetsSellFromDB = async (query: Record<string, unknown> = {}) => {
  const filter: Record<string, unknown> = {};

  if (typeof query.assetsGroup === "string" && query.assetsGroup.trim()) {
    filter.assetsGroup = query.assetsGroup.trim();
  }

  if (
    typeof query.assetsSubGroup === "string" &&
    query.assetsSubGroup.trim()
  ) {
    filter.assetsSubGroup = query.assetsSubGroup.trim();
  }

  return await AssetsSell.find(filter)
    .populate([
      { path: "assetsGroup", select: "groupName" },
      { path: "assetsSubGroup", select: "subGroupName groupId" },
    ])
    .sort({ createdAt: -1 });
};

// সিঙ্গেল Asset Sell রেকর্ড আনা
const getSingleAssetsSellByIdFromDB = async (id: string) => {
  return await AssetsSell.findById(id).populate([
    { path: "assetsGroup", select: "groupName" },
    { path: "assetsSubGroup", select: "subGroupName groupId" },
  ]);
};

// Asset Sell তথ্য আপডেট করা
const updateAssetsSellIntoDB = async (
  id: string,
  payload: Partial<IAssetsSell>
) => {
  const allowedUpdate: Record<string, unknown> = {};
  if (payload.sellDate !== undefined) {
    allowedUpdate.sellDate = new Date(payload.sellDate);
  }
  if (payload.customerName !== undefined) {
    allowedUpdate.customerName = payload.customerName;
  }
  if (payload.customerPhone !== undefined) {
    allowedUpdate.customerPhone = payload.customerPhone;
  }
  if (payload.notes !== undefined) {
    allowedUpdate.notes = payload.notes;
  }

  return await AssetsSell.findByIdAndUpdate(id, allowedUpdate, {
    new: true,
    runValidators: true,
  }).populate([
    { path: "assetsGroup", select: "groupName" },
    { path: "assetsSubGroup", select: "subGroupName groupId" },
  ]);
};

// Asset Sell রেকর্ড ডিলিট করা
const deleteAssetsSellFromDB = async (id: string) => {
  return await AssetsSell.findByIdAndDelete(id);
};

export const AssetsSellService = {
  getSelectableAssetsByGroupAndSubGroupFromDB,
  createAssetsSellIntoDB,
  getAllAssetsSellFromDB,
  getSingleAssetsSellByIdFromDB,
  updateAssetsSellIntoDB,
  deleteAssetsSellFromDB,
};