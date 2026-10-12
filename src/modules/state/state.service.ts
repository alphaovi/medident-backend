import { States } from "./state.interface.js";
import { State } from "./state.model.js";

const createStateIntoDB = async (payload: States) => {
  const result = await State.create(payload);
  return result;
};

const getAllStatesFromDB = async () => {
  const result = await State.find().sort({ createdAt: -1 });
  return result;
};

// নতুন আপডেট সার্ভিস ফাংশন
const updateStateInDB = async (id: string, payload: Partial<States>) => {
  const result = await State.findByIdAndUpdate(id, payload, {
    new: true, // আপডেট হওয়ার পর নতুন ডাটা রিটার্ন করবে
    runValidators: true, // স্কিমা ভ্যালিডেশন চেক করবে
  });
  return result;
};

const deleteStateFromDB = async (id: string) => {
  const result = await State.findByIdAndDelete(id);
  return result;
};

export const StateServices = {
  createStateIntoDB,
  getAllStatesFromDB,
  updateStateInDB, // এক্সপোর্ট করা হলো
  deleteStateFromDB,
};