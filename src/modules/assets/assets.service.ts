import mongoose from "mongoose";
import {
  IAssetItem,
  IAssets,
  TDepreciationMode,
  TDepreciationPeriod,
} from "./assets.interface.js";
import { Assets } from "./assets.model.js";
import { AssetsGroup } from "../assetsGroup/assetsGroup.model.js";
import { AssetsSubGroup } from "../assetsSubGroup/assetsSubGroup.model.js";
import { UserModel } from "../user/user.model.js";
import { BanksDetailModel } from "../banksDetail/banksDetail.model.js";
import { BanksDetailServices } from "../banksDetail/banksDetail.service.js";

const round2 = (num: number): number => Number(num.toFixed(2));

const populateAssetsQuery = (query: any) =>
  query.populate([
    { path: "assetsGroup", select: "groupName" },
    { path: "assetsSubGroup", select: "subGroupName groupId" },
    { path: "paidBy", select: "name email role phone" },
    { path: "paidFrom", select: "bankName accountNo accountName currentBalance user" },
  ]);

const calculateElapsedPeriods = (
  purchaseDate: Date | string | undefined,
  period: TDepreciationPeriod,
  explicitElapsed?: number
): number => {
  if (typeof explicitElapsed === "number" && !Number.isNaN(explicitElapsed)) {
    return Math.max(0, Math.floor(explicitElapsed));
  }

  if (!purchaseDate) return 0;

  const start = new Date(purchaseDate);
  const now = new Date();
  if (Number.isNaN(start.getTime()) || now <= start) return 0;

  if (period === "monthly") {
    const yearsDiff = now.getFullYear() - start.getFullYear();
    const monthsDiff = now.getMonth() - start.getMonth();
    let totalMonths = yearsDiff * 12 + monthsDiff;
    if (now.getDate() < start.getDate()) {
      totalMonths -= 1;
    }
    return Math.max(0, totalMonths);
  }

  // yearly
  let years = now.getFullYear() - start.getFullYear();
  const hasAnniversaryPassed =
    now.getMonth() > start.getMonth() ||
    (now.getMonth() === start.getMonth() && now.getDate() >= start.getDate());
  if (!hasAnniversaryPassed) {
    years -= 1;
  }
  return Math.max(0, years);
};

const calculateAssetsData = (items: IAssetItem[]) => {
  let totalQuantity = 0;
  let grandTotalCost = 0;
  let totalDepreciatedAmount = 0;
  let totalRemainingDepreciableAmount = 0;

  const calculatedAssets = items.map((item) => {
    const quantity = Math.max(1, Number(item.quantity || 1));
    const unitPrice = Math.max(0, Number(item.unitPrice || 0));
    const totalCost = round2(quantity * unitPrice);

    const depreciationPeriod: TDepreciationPeriod =
      item.depreciationPeriod === "monthly" ? "monthly" : "yearly";
    const depreciationMode: TDepreciationMode =
      item.depreciationMode === "amount" ? "amount" : "percentage";
    const depreciationValue = Math.max(0, Number(item.depreciationValue || 0));

    const purchaseDate = item.purchaseDate
      ? new Date(item.purchaseDate)
      : new Date();

    const elapsedPeriods = calculateElapsedPeriods(
      purchaseDate,
      depreciationPeriod,
      item.elapsedPeriods
    );

    const depreciationPerPeriod =
      depreciationMode === "percentage"
        ? round2((totalCost * depreciationValue) / 100)
        : round2(depreciationValue);

    const rawDepreciated = round2(depreciationPerPeriod * elapsedPeriods);
    const depreciatedAmount = round2(Math.min(totalCost, rawDepreciated));

    const remainingDepreciableAmount = round2(
      Math.max(0, totalCost - depreciatedAmount)
    );

    const isFullyDepreciated = remainingDepreciableAmount <= 0;

    const rateText =
      depreciationMode === "percentage"
        ? `${depreciationValue}% (৳${depreciationPerPeriod})`
        : `৳${depreciationValue}`;

    const periodLabel = depreciationPeriod === "monthly" ? "month" : "year";
    const elapsedLabel = depreciationPeriod === "monthly" ? "months" : "years";

    const depreciationSummary = `${
      depreciationPeriod === "monthly" ? "Monthly" : "Yearly"
    } ${rateText}/${periodLabel} • Elapsed: ${elapsedPeriods} ${elapsedLabel} • Depreciated: ৳${depreciatedAmount} • Remaining: ৳${remainingDepreciableAmount}`;

    totalQuantity += quantity;
    grandTotalCost += totalCost;
    totalDepreciatedAmount += depreciatedAmount;
    totalRemainingDepreciableAmount += remainingDepreciableAmount;

    return {
      ...item,
      purchaseDate,
      quantity,
      unitPrice,
      totalCost,
      depreciationPeriod,
      depreciationMode,
      depreciationValue,
      elapsedPeriods,
      depreciationPerPeriod,
      depreciatedAmount,
      remainingDepreciableAmount,
      isFullyDepreciated,
      depreciationSummary,
    };
  });

  return {
    assets: calculatedAssets,
    totalQuantity,
    grandTotalCost: round2(grandTotalCost),
    totalDepreciatedAmount: round2(totalDepreciatedAmount),
    totalRemainingDepreciableAmount: round2(totalRemainingDepreciableAmount),
  };
};

const validateGroupAndSubGroup = async (
  groupId: unknown,
  subGroupId: unknown
) => {
  const group = await AssetsGroup.findById(groupId);
  if (!group) {
    throw new Error("Referenced Asset Group does not exist");
  }

  const subGroup = await AssetsSubGroup.findById(subGroupId);
  if (!subGroup) {
    throw new Error("Referenced Asset Sub-Group does not exist");
  }

  if (String(subGroup.groupId) !== String(group._id)) {
    throw new Error(
      "Selected Asset Sub-Group does not belong to the selected Asset Group"
    );
  }
};

const validateUserAndBankAccount = async (paidBy: unknown, paidFrom: unknown) => {
  if (!paidBy || !mongoose.isValidObjectId(String(paidBy))) {
    throw new Error("Valid user (paidBy) is required");
  }
  if (!paidFrom || !mongoose.isValidObjectId(String(paidFrom))) {
    throw new Error("Valid bank/cash account (paidFrom) is required");
  }

  const userDoc = await UserModel.findById(paidBy).select("_id");
  if (!userDoc) {
    throw new Error("Selected user does not exist");
  }

  const bankDoc = await BanksDetailModel.findById(paidFrom);
  if (!bankDoc) {
    throw new Error("Selected bank/cash account does not exist");
  }

  const bankOwnerId =
    typeof bankDoc.user === "object" && bankDoc.user !== null && "_id" in bankDoc.user
      ? String((bankDoc.user as any)._id)
      : String(bankDoc.user);

  if (bankOwnerId !== String(userDoc._id)) {
    throw new Error("Selected bank account does not belong to the selected user");
  }
};

const createAssetsIntoDB = async (payload: IAssets) => {
  await validateGroupAndSubGroup(payload.assetsGroup, payload.assetsSubGroup);

  if (payload.paidBy && payload.paidFrom) {
    await validateUserAndBankAccount(payload.paidBy, payload.paidFrom);
  } else if (payload.paidFrom) {
    const bankDoc = await BanksDetailModel.findById(payload.paidFrom);
    if (!bankDoc) {
      throw new Error("Selected bank/cash account does not exist");
    }
  }

  const calculated = calculateAssetsData(payload.assets || []);
  const firstPurchaseDate = calculated.assets[0]?.purchaseDate
    ? new Date(calculated.assets[0].purchaseDate)
    : new Date();
  const itemNames = calculated.assets.map((a) => a.assetName).join(", ");

  // 1. ব্যাংক অ্যাকাউন্ট সিলেক্ট করা থাকলে ওই অ্যাকাউন্ট থেকে টাকা মাইনাস (-) হবে এবং ব্যাংক স্টেটমেন্টে সেভ হবে
  if (payload.paidFrom && calculated.grandTotalCost > 0) {
    await BanksDetailServices.recordAssetPurchaseOutFromBank({
      bankId: payload.paidFrom,
      amount: calculated.grandTotalCost,
      date: firstPurchaseDate,
      note: `Asset Purchase: ${itemNames}`,
    });
  }

  try {
    const created = await Assets.create({
      assetsGroup: payload.assetsGroup,
      assetsSubGroup: payload.assetsSubGroup,
      ...(payload.paidBy ? { paidBy: payload.paidBy } : {}),
      ...(payload.paidFrom ? { paidFrom: payload.paidFrom } : {}),
      ...calculated,
    });

    return await populateAssetsQuery(Assets.findById(created._id));
  } catch (err) {
    if (payload.paidFrom && calculated.grandTotalCost > 0) {
      await BanksDetailServices.recordAssetSellDepositIntoBank({
        bankId: payload.paidFrom,
        amount: calculated.grandTotalCost,
        date: new Date(),
        note: "Rollback failed asset purchase creation",
      });
    }
    throw err;
  }
};

const getAllAssetsFromDB = async (query: Record<string, unknown> = {}) => {
  const filter: Record<string, unknown> = {};

  if (typeof query.assetsGroup === "string" && query.assetsGroup.trim()) {
    filter.assetsGroup = query.assetsGroup.trim();
  }

  if (typeof query.assetsSubGroup === "string" && query.assetsSubGroup.trim()) {
    filter.assetsSubGroup = query.assetsSubGroup.trim();
  }

  if (typeof query.paidBy === "string" && query.paidBy.trim()) {
    filter.paidBy = query.paidBy.trim();
  }

  if (typeof query.paidFrom === "string" && query.paidFrom.trim()) {
    filter.paidFrom = query.paidFrom.trim();
  }

  if (typeof query.searchTerm === "string" && query.searchTerm.trim()) {
    filter["assets.assetName"] = {
      $regex: query.searchTerm.trim(),$options: "i",
    };
  }

  const docs = await populateAssetsQuery(
    Assets.find(filter).sort({ createdAt: -1 })
  );

  return docs.map((doc: any) => {
    const plain = doc.toObject();
    const recalc = calculateAssetsData(plain.assets || []);
    return {
      ...plain,
      ...recalc,
    };
  });
};

const getAssetDepreciationReportFromDB = async (
  query: Record<string, unknown> = {}
) => {
  const groupedRecords = await getAllAssetsFromDB(query);

  const reportItems = groupedRecords.flatMap((record: any) => {
    const groupName = record.assetsGroup?.groupName || "N/A";
    const subGroupName = record.assetsSubGroup?.subGroupName || "N/A";

    return (record.assets || []).map((item: any) => ({
      recordId: record._id,
      itemId: item._id,
      assetsGroup: record.assetsGroup,
      groupName,
      assetsSubGroup: record.assetsSubGroup,
      subGroupName,
      paidBy: record.paidBy,
      paidFrom: record.paidFrom,
      assetName: item.assetName,
      assetCode: item.assetCode || "",
      purchaseDate: item.purchaseDate,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalCost: item.totalCost,
      depreciationPeriod: item.depreciationPeriod,
      depreciationMode: item.depreciationMode,
      depreciationValue: item.depreciationValue,
      depreciationPerPeriod: item.depreciationPerPeriod,
      elapsedPeriods: item.elapsedPeriods,
      depreciatedAmount: item.depreciatedAmount,
      remainingDepreciableAmount: item.remainingDepreciableAmount,
      isFullyDepreciated: item.isFullyDepreciated,
      depreciationSummary: item.depreciationSummary,
      notes: item.notes || "",
    }));
  });

  const summary = {
    totalItems: reportItems.length,
    totalQuantity: round2(
      reportItems.reduce((sum: number, r: any) => sum + Number(r.quantity || 0), 0)
    ),
    grandTotalCost: round2(
      reportItems.reduce((sum: number, r: any) => sum + Number(r.totalCost || 0), 0)
    ),
    totalDepreciatedAmount: round2(
      reportItems.reduce(
        (sum: number, r: any) => sum + Number(r.depreciatedAmount || 0),
        0
      )
    ),
    totalRemainingDepreciableAmount: round2(
      reportItems.reduce(
        (sum: number, r: any) => sum + Number(r.remainingDepreciableAmount || 0),
        0
      )
    ),
  };

  return {
    summary,
    items: reportItems,
  };
};

const getAssetTransactionReportFromDB = async (
  query: Record<string, unknown> = {}
) => {
  const typeFilter = String(query.type || "all").toLowerCase();
  const userId = typeof query.userId === "string" ? query.userId.trim() : "";
  const bankId =
    typeof query.bankAccountId === "string" ? query.bankAccountId.trim() : "";
  const groupId =
    typeof query.assetsGroup === "string" ? query.assetsGroup.trim() : "";
  const startDate = query.startDate ? new Date(String(query.startDate)) : null;
  const endDate = query.endDate ? new Date(String(query.endDate)) : null;
  if (endDate) endDate.setHours(23, 59, 59, 999);

  const records: any[] = [];

  if (typeFilter === "all" || typeFilter === "purchase") {
    const pFilter: Record<string, unknown> = {};
    if (userId) pFilter.paidBy = userId;
    if (bankId) pFilter.paidFrom = bankId;
    if (groupId) pFilter.assetsGroup = groupId;
    if (startDate || endDate) {
      pFilter.createdAt = {};
      if (startDate) (pFilter.createdAt as any).$gte = startDate;
      if (endDate) (pFilter.createdAt as any).$lte = endDate;
    }

    const purchases = await populateAssetsQuery(
      Assets.find(pFilter).sort({ createdAt: -1 })
    );

    purchases.forEach((doc: any) => {
      const p = doc.toObject();
      records.push({
        _id: p._id,
        type: "purchase",
        direction: "out",
        date: p.assets?.[0]?.purchaseDate || p.createdAt,
        assetsGroup: p.assetsGroup,
        assetsSubGroup: p.assetsSubGroup,
        user: p.paidBy || null,
        bankAccount: p.paidFrom || null,
        items: p.assets || [],
        quantity: p.totalQuantity || 0,
        amount: p.grandTotalCost || 0,
        createdAt: p.createdAt,
      });
    });
  }

  if (
    (typeFilter === "all" || typeFilter === "sell") &&
    mongoose.models.AssetsSell
  ) {
    const AssetsSellModel = mongoose.models.AssetsSell;
    const sFilter: Record<string, unknown> = {};
    if (userId) sFilter.receivedBy = userId;
    if (bankId) sFilter.depositToBank = bankId;
    if (groupId) sFilter.assetsGroup = groupId;
    if (startDate || endDate) {
      sFilter.sellDate = {};
      if (startDate) (sFilter.sellDate as any).$gte = startDate;
      if (endDate) (sFilter.sellDate as any).$lte = endDate;
    }

    const sales = await AssetsSellModel.find(sFilter)
      .populate("assetsGroup", "groupName")
      .populate("assetsSubGroup", "subGroupName")
      .populate("receivedBy", "name email role")
      .populate("depositToBank", "bankName accountNo accountName currentBalance")
      .sort({ sellDate: -1, createdAt: -1 });

    sales.forEach((doc: any) => {
      const s = doc.toObject();
      records.push({
        _id: s._id,
        invoiceNo: s.invoiceNo || "",
        type: "sell",
        direction: "in",
        date: s.sellDate || s.createdAt,
        assetsGroup: s.assetsGroup,
        assetsSubGroup: s.assetsSubGroup,
        user: s.receivedBy || null,
        bankAccount: s.depositToBank || null,
        soldItems: s.soldItems || [],
        quantity: s.totalSoldQuantity || 0,
        amount: s.grandTotalSellAmount || 0,
        profitOrLoss: s.grandProfitOrLoss || 0,
        customerName: s.customerName || "",
        customerPhone: s.customerPhone || "",
        createdAt: s.createdAt,
      });
    });
  }

  records.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const totalPurchase = round2(
    records
      .filter((r) => r.type === "purchase")
      .reduce((sum, r) => sum + Number(r.amount || 0), 0)
  );
  const totalSell = round2(
    records
      .filter((r) => r.type === "sell")
      .reduce((sum, r) => sum + Number(r.amount || 0), 0)
  );

  return {
    summary: {
      totalRecords: records.length,
      totalPurchase,
      totalSell,
      netBalanceEffect: round2(totalSell - totalPurchase),
    },
    records,
  };
};

const getSingleAssetByIdFromDB = async (id: string) => {
  const doc = await populateAssetsQuery(Assets.findById(id));
  if (!doc) return null;

  const plain = doc.toObject();
  const recalc = calculateAssetsData(plain.assets || []);
  return {
    ...plain,
    ...recalc,
  };
};

const updateAssetsIntoDB = async (id: string, payload: Partial<IAssets>) => {
  const existingDoc = await Assets.findById(id);
  if (!existingDoc) {
    return null;
  }

  const targetGroupId = payload.assetsGroup || existingDoc.assetsGroup;
  const targetSubGroupId = payload.assetsSubGroup || existingDoc.assetsSubGroup;
  const targetPaidBy = payload.paidBy || existingDoc.paidBy;
  const targetPaidFrom = payload.paidFrom || existingDoc.paidFrom;

  await validateGroupAndSubGroup(targetGroupId, targetSubGroupId);
  if (targetPaidBy && targetPaidFrom) {
    await validateUserAndBankAccount(targetPaidBy, targetPaidFrom);
  }

  const sourceItems = payload.assets ?? existingDoc.assets;
  const calculated = calculateAssetsData(sourceItems);

  const oldBankId = existingDoc.paidFrom ? String(existingDoc.paidFrom) : null;
  const newBankId = targetPaidFrom ? String(targetPaidFrom) : null;
  const oldTotal = Number(existingDoc.grandTotalCost || 0);
  const newTotal = Number(calculated.grandTotalCost || 0);

  if (oldBankId && newBankId) {
    if (oldBankId === newBankId) {
      const diff = round2(newTotal - oldTotal);
      if (diff > 0) {
        await BanksDetailServices.recordAssetPurchaseOutFromBank({
          bankId: newBankId,
          amount: diff,
          date: new Date(),
          referenceId: existingDoc._id,
          note: `Asset purchase updated (increased) (Ref: ${existingDoc._id})`,
        });
      } else if (diff < 0) {
        await BanksDetailServices.recordAssetSellDepositIntoBank({
          bankId: newBankId,
          amount: Math.abs(diff),
          date: new Date(),
          referenceId: existingDoc._id,
          note: `Asset purchase updated (decreased) (Ref: ${existingDoc._id})`,
        });
      }
    } else {
      if (newTotal > 0) {
        await BanksDetailServices.recordAssetPurchaseOutFromBank({
          bankId: newBankId,
          amount: newTotal,
          date: new Date(),
          referenceId: existingDoc._id,
          note: `Asset purchase moved to account (Ref: ${existingDoc._id})`,
        });
      }
      if (oldTotal > 0) {
        await BanksDetailServices.recordAssetSellDepositIntoBank({
          bankId: oldBankId,
          amount: oldTotal,
          date: new Date(),
          referenceId: existingDoc._id,
          note: `Asset purchase refunded to old account (Ref: ${existingDoc._id})`,
        });
      }
    }
  } else if (!oldBankId && newBankId && newTotal > 0) {
    await BanksDetailServices.recordAssetPurchaseOutFromBank({
      bankId: newBankId,
      amount: newTotal,
      date: new Date(),
      referenceId: existingDoc._id,
      note: `Asset purchase payment (Ref: ${existingDoc._id})`,
    });
  }

  const updated = await populateAssetsQuery(
    Assets.findByIdAndUpdate(
      id,
      {
        assetsGroup: targetGroupId,
        assetsSubGroup: targetSubGroupId,
        ...(targetPaidBy ? { paidBy: targetPaidBy } : {}),
        ...(targetPaidFrom ? { paidFrom: targetPaidFrom } : {}),
        ...calculated,
      },
      { new: true, runValidators: true }
    )
  );

  return updated;
};

const addAssetItemIntoDB = async (docId: string, itemPayload: IAssetItem) => {
  const existingDoc = await Assets.findById(docId);
  if (!existingDoc) {
    return null;
  }

  const mergedItems = [...existingDoc.assets, itemPayload];
  const calculated = calculateAssetsData(mergedItems);

  const diff = round2(
    Number(calculated.grandTotalCost || 0) -
      Number(existingDoc.grandTotalCost || 0)
  );

  if (existingDoc.paidFrom && diff > 0) {
    await BanksDetailServices.recordAssetPurchaseOutFromBank({
      bankId: existingDoc.paidFrom,
      amount: diff,
      date: new Date(),
      referenceId: existingDoc._id,
      note: `Asset item added: ${itemPayload.assetName}`,
    });
  }

  const updated = await populateAssetsQuery(
    Assets.findByIdAndUpdate(
      docId,
      { ...calculated },
      { new: true, runValidators: true }
    )
  );

  return updated;
};

const removeAssetItemFromDB = async (docId: string, itemId: string) => {
  const existingDoc = await Assets.findById(docId);
  if (!existingDoc) {
    return null;
  }

  const remainingItems = existingDoc.assets.filter(
    (item: any) => String(item._id) !== String(itemId)
  );

  if (remainingItems.length === 0) {
    throw new Error(
      "Cannot remove the last asset item. Delete the record instead."
    );
  }

  const calculated = calculateAssetsData(remainingItems);
  const diff = round2(
    Number(existingDoc.grandTotalCost || 0) -
      Number(calculated.grandTotalCost || 0)
  );

  if (existingDoc.paidFrom && diff > 0) {
    await BanksDetailServices.recordAssetSellDepositIntoBank({
      bankId: existingDoc.paidFrom,
      amount: diff,
      date: new Date(),
      referenceId: existingDoc._id,
      note: `Asset item removed refund (Ref: ${existingDoc._id})`,
    });
  }

  const updated = await populateAssetsQuery(
    Assets.findByIdAndUpdate(
      docId,
      { ...calculated },
      { new: true, runValidators: true }
    )
  );

  return updated;
};

const deleteAssetsFromDB = async (id: string) => {
  const existingDoc = await Assets.findById(id);
  if (!existingDoc) {
    return null;
  }

  const refundAmount = Number(existingDoc.grandTotalCost || 0);
  if (existingDoc.paidFrom && refundAmount > 0) {
    await BanksDetailServices.recordAssetSellDepositIntoBank({
      bankId: existingDoc.paidFrom,
      amount: refundAmount,
      date: new Date(),
      referenceId: existingDoc._id,
      note: `Deleted asset record refund (Ref: ${existingDoc._id})`,
    });
  }

  return await Assets.findByIdAndDelete(id);
};

export const AssetsService = {
  createAssetsIntoDB,
  getAllAssetsFromDB,
  getAssetDepreciationReportFromDB,
  getAssetTransactionReportFromDB,
  getSingleAssetByIdFromDB,
  updateAssetsIntoDB,
  addAssetItemIntoDB,
  removeAssetItemFromDB,
  deleteAssetsFromDB,
};