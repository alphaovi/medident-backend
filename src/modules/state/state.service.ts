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

const deleteStateFromDB = async (id: string) => {
  const result = await State.findByIdAndDelete(id);
  return result;
};

export const StateServices = {
  createStateIntoDB,
  getAllStatesFromDB,
  deleteStateFromDB,
};