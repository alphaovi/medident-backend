import mongoose, { Types } from "mongoose";
import { BanksDetailModel } from "./banksDetail.model.js";
import { IBankDetail, IJwtPayload } from "./banksDetail.interface.js";

const round2 = (num: number): number => Number(Number(num).toFixed(2));

const createBankDetailIntoDB = async (
  payload: Partial<IBankDetail>,
  requester: IJwtPayload
) => {
  const targetUserId =
    requester.role === "admin" && payload.user
      ? payload.user
      : requester.userId;

  const openingBalance = round2(Number(payload.openingBalance || 0));

  const newBank = await BanksDetailModel.create({
    ...payload,
    user: targetUserId,
    openingBalance,
    currentBalance: openingBalance,
    transactions:
      openingBalance > 0
        ? [
            {
              type: "deposit",
              direction: "in",
              amount: openingBalance,
              date: new Date(),
              note: "Opening balance",
            },
          ]
        : [],
  });

  if (openingBalance > 0) {
    newBank.transactions[0].bankAccount = newBank._id;
    await newBank.save();
  }

  return await BanksDetailModel.findById(newBank._id).populate(
    "user",
    "name email role"
  );
};

const getAllBankDetailsFromDB = async (_requester?: IJwtPayload) => {
  return await BanksDetailModel.find({})
    .populate("user", "name email role")
    .populate("transactions.bankAccount", "bankName accountNo accountName")
    .populate("transactions.fromAccount", "bankName accountNo accountName")
    .populate("transactions.toAccount", "bankName accountNo accountName")
    .sort({ createdAt: -1 });
};

const getSingleBankDetailFromDB = async (id: string) => {
  return await BanksDetailModel.findById(id)
    .populate("user", "name email role")
    .populate("transactions.bankAccount", "bankName accountNo accountName")
    .populate("transactions.fromAccount", "bankName accountNo accountName")
    .populate("transactions.toAccount", "bankName accountNo accountName");
};

const updateBankDetailIntoDB = async (
  id: string,
  payload: Partial<IBankDetail>
) => {
  return await BanksDetailModel.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  }).populate("user", "name email role");
};

const deleteBankDetailFromDB = async (id: string) => {
  return await BanksDetailModel.findByIdAndDelete(id);
};

// Asset Purchase করলে ব্যাংক অ্যাকাউন্ট থেকে টাকা মাইনাস (-) হবে (direction: "out")
const recordAssetPurchaseOutFromBank = async (params: {
  bankId: Types.ObjectId | string;
  amount: number;
  date?: Date | string;
  referenceId?: Types.ObjectId | string;
  note?: string;
  createdBy?: Types.ObjectId | string;
}) => {
  const bank = await BanksDetailModel.findById(params.bankId);
  if (!bank) {
    throw new Error("Selected bank/cash account not found");
  }

  const amount = round2(Number(params.amount || 0));
  if (amount <= 0) return bank;

  const currentBalance = round2(Number(bank.currentBalance || 0));
  if (currentBalance < amount) {
    throw new Error(
      `Insufficient balance in ${bank.bankName} (${bank.accountName}). Available: ৳${currentBalance}, Required: ৳${amount}`
    );
  }

  const balanceAfter = round2(currentBalance - amount);
  bank.currentBalance = balanceAfter;
  bank.transactions.push({
    bankAccount: bank._id,
    type: "asset_purchase",
    direction: "out",
    amount,
    date: params.date ? new Date(params.date) : new Date(),
    referenceId: params.referenceId
      ? new mongoose.Types.ObjectId(String(params.referenceId))
      : null,
    note: params.note || "Asset Purchase",
  } as any);

  await bank.save();
  return bank;
};

// Asset Sell করলে ব্যাংক অ্যাকাউন্টে টাকা প্লাস (+) হবে (direction: "in")
const recordAssetSellDepositIntoBank = async (params: {
  bankId: Types.ObjectId | string;
  amount: number;
  date?: Date | string;
  referenceId?: Types.ObjectId | string;
  note?: string;
  createdBy?: Types.ObjectId | string;
}) => {
  const bank = await BanksDetailModel.findById(params.bankId);
  if (!bank) {
    throw new Error("Selected deposit bank/cash account not found");
  }

  const amount = round2(Number(params.amount || 0));
  if (amount <= 0) return bank;

  const currentBalance = round2(Number(bank.currentBalance || 0));
  const balanceAfter = round2(currentBalance + amount);
  bank.currentBalance = balanceAfter;
  bank.transactions.push({
    bankAccount: bank._id,
    type: "asset_sell",
    direction: "in",
    amount,
    date: params.date ? new Date(params.date) : new Date(),
    referenceId: params.referenceId
      ? new mongoose.Types.ObjectId(String(params.referenceId))
      : null,
    note: params.note || "Asset Sell Deposit",
  } as any);

  await bank.save();
  return bank;
};

export const BanksDetailServices = {
  createBankDetailIntoDB,
  getAllBankDetailsFromDB,
  getSingleBankDetailFromDB,
  updateBankDetailIntoDB,
  deleteBankDetailFromDB,
  recordAssetPurchaseOutFromBank,
  recordAssetSellDepositIntoBank,
};