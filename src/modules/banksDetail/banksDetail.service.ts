import { BanksDetailModel } from "./banksDetail.model.js";
import { IBanksDetail } from "./banksDetail.interface.js";

const createBankDetailIntoDB = async (payload: Partial<IBanksDetail>) => {
  return await BanksDetailModel.create(payload);
};

const getAllBankDetailsFromDB = async () => {
  return await BanksDetailModel.find().sort({ createdAt: -1 });
};

const getSingleBankDetailFromDB = async (id: string) => {
  return await BanksDetailModel.findById(id);
};

const updateBankDetailIntoDB = async (id: string, payload: Partial<IBanksDetail>) => {
  return await BanksDetailModel.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });
};

const deleteBankDetailFromDB = async (id: string) => {
  return await BanksDetailModel.findByIdAndDelete(id);
};

export const BanksDetailServices = {
  createBankDetailIntoDB,
  getAllBankDetailsFromDB,
  getSingleBankDetailFromDB,
  updateBankDetailIntoDB,
  deleteBankDetailFromDB,
};