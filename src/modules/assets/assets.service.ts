import {
  IAssetItem,
  IAssets,
  TDepreciationMode,
  TDepreciationPeriod,
} from "./assets.interface.js";
import { Assets } from "./assets.model.js";
import { AssetsGroup } from "../assetsGroup/assetsGroup.model.js"; // আপনার AssetsGroup ফাইলের পাথ ঠিক রাখুন
import { AssetsSubGroup } from "../assetsSubGroup/assetsSubGroup.model.js"; // আপনার AssetsSubGroup ফাইলের পাথ ঠিক রাখুন

const round2 = (num: number): number => Number(num.toFixed(2));

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

    // প্রতি মাস বা বছরে কত টাকা কাটবে
    const depreciationPerPeriod =
      depreciationMode === "percentage"
        ? round2((totalCost * depreciationValue) / 100)
        : round2(depreciationValue);

    // এখন পর্যন্ত কত টাকা কাটা হয়েছে
    const rawDepreciated = round2(depreciationPerPeriod * elapsedPeriods);
    const depreciatedAmount = round2(Math.min(totalCost, rawDepreciated));

    // ভবিষ্যতে আর কত টাকা কাটবে
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

const createAssetsIntoDB = async (payload: IAssets) => {
  await validateGroupAndSubGroup(payload.assetsGroup, payload.assetsSubGroup);

  const calculated = calculateAssetsData(payload.assets || []);

  const created = await Assets.create({
    assetsGroup: payload.assetsGroup,
    assetsSubGroup: payload.assetsSubGroup,
    ...calculated,
  });

  return await created.populate([
    { path: "assetsGroup", select: "groupName" },
    { path: "assetsSubGroup", select: "subGroupName groupId" },
  ]);
};

// সব অ্যাসেট ও তাদের বর্তমান depreciation রিপোর্ট/ভিউ রিটার্ন করে
const getAllAssetsFromDB = async (query: Record<string, unknown> = {}) => {
  const filter: Record<string, unknown> = {};

  if (typeof query.assetsGroup === "string" && query.assetsGroup.trim()) {
    filter.assetsGroup = query.assetsGroup.trim();
  }

  if (typeof query.assetsSubGroup === "string" && query.assetsSubGroup.trim()) {
    filter.assetsSubGroup = query.assetsSubGroup.trim();
  }

  if (typeof query.searchTerm === "string" && query.searchTerm.trim()) {
    filter["assets.assetName"] = {
      $regex: query.searchTerm.trim(),
      $options: "i",
    };
  }

  const docs = await Assets.find(filter)
    .populate([
      { path: "assetsGroup", select: "groupName" },
      { path: "assetsSubGroup", select: "subGroupName groupId" },
    ])
    .sort({ createdAt: -1 });

  return docs.map((doc) => {
    const plain = doc.toObject();
    const recalc = calculateAssetsData(plain.assets || []);
    return {
      ...plain,
      ...recalc,
    };
  });
};

// ফ্ল্যাট লিস্ট আকারে প্রতিটি অ্যাসেট আইটেমের কেনার তারিখ, পিরিয়ড, রেট, কাটা টাকা ও বাকি টাকা দেখার জন্য
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
      assetName: item.assetName,
      assetCode: item.assetCode || "",
      purchaseDate: item.purchaseDate,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalCost: item.totalCost,
      depreciationPeriod: item.depreciationPeriod, // "monthly" | "yearly"
      depreciationMode: item.depreciationMode, // "amount" | "percentage"
      depreciationValue: item.depreciationValue, // কত টাকা বা কত %
      depreciationPerPeriod: item.depreciationPerPeriod, // প্রতি মাস বা বছরে কত টাকা
      elapsedPeriods: item.elapsedPeriods, // কত মাস বা বছর পার হয়েছে
      depreciatedAmount: item.depreciatedAmount, // এখন পর্যন্ত কত টাকা কাটা হয়েছে
      remainingDepreciableAmount: item.remainingDepreciableAmount, // ভবিষ্যতে আর কত টাকা কাটবে
      isFullyDepreciated: item.isFullyDepreciated,
      depreciationSummary: item.depreciationSummary,
      notes: item.notes || "",
    }));
  });

  const summary = {
    totalItems: reportItems.length,
    totalQuantity: round2(
      reportItems.reduce((sum, r) => sum + Number(r.quantity || 0), 0)
    ),
    grandTotalCost: round2(
      reportItems.reduce((sum, r) => sum + Number(r.totalCost || 0), 0)
    ),
    totalDepreciatedAmount: round2(
      reportItems.reduce((sum, r) => sum + Number(r.depreciatedAmount || 0), 0)
    ),
    totalRemainingDepreciableAmount: round2(
      reportItems.reduce(
        (sum, r) => sum + Number(r.remainingDepreciableAmount || 0),
        0
      )
    ),
  };

  return {
    summary,
    items: reportItems,
  };
};

const getSingleAssetByIdFromDB = async (id: string) => {
  const doc = await Assets.findById(id).populate([
    { path: "assetsGroup", select: "groupName description" },
    { path: "assetsSubGroup", select: "subGroupName description groupId" },
  ]);

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

  await validateGroupAndSubGroup(targetGroupId, targetSubGroupId);

  const sourceItems = payload.assets ?? existingDoc.assets;
  const calculated = calculateAssetsData(sourceItems);

  const updated = await Assets.findByIdAndUpdate(
    id,
    {
      assetsGroup: targetGroupId,
      assetsSubGroup: targetSubGroupId,
      ...calculated,
    },
    { new: true, runValidators: true }
  ).populate([
    { path: "assetsGroup", select: "groupName" },
    { path: "assetsSubGroup", select: "subGroupName groupId" },
  ]);

  return updated;
};

const addAssetItemIntoDB = async (docId: string, itemPayload: IAssetItem) => {
  const existingDoc = await Assets.findById(docId);
  if (!existingDoc) {
    return null;
  }

  const mergedItems = [...existingDoc.assets, itemPayload];
  const calculated = calculateAssetsData(mergedItems);

  const updated = await Assets.findByIdAndUpdate(
    docId,
    { ...calculated },
    { new: true, runValidators: true }
  ).populate([
    { path: "assetsGroup", select: "groupName" },
    { path: "assetsSubGroup", select: "subGroupName groupId" },
  ]);

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

  const updated = await Assets.findByIdAndUpdate(
    docId,
    { ...calculated },
    { new: true, runValidators: true }
  ).populate([
    { path: "assetsGroup", select: "groupName" },
    { path: "assetsSubGroup", select: "subGroupName groupId" },
  ]);

  return updated;
};

const deleteAssetsFromDB = async (id: string) => {
  const result = await Assets.findByIdAndDelete(id);
  return result;
};

export const AssetsService = {
  createAssetsIntoDB,
  getAllAssetsFromDB,
  getAssetDepreciationReportFromDB,
  getSingleAssetByIdFromDB,
  updateAssetsIntoDB,
  addAssetItemIntoDB,
  removeAssetItemFromDB,
  deleteAssetsFromDB,
};
