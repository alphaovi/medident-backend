import { Types } from "mongoose";

export type ProductSubgroup = {
  id: string;
  group: Types.ObjectId;
  subGroupName: string;
};