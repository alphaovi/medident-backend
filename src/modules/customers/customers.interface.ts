import { Types } from "mongoose";

export type CustomerStatus = "Active" | "Inactive";

export type BangladeshDivision =
  | "Barisal"
  | "Chattogram"
  | "Dhaka"
  | "Khulna"
  | "Mymensingh"
  | "Rajshahi"
  | "Rangpur"
  | "Sylhet";

export type Customer = {
  id: string;
  name: string;
  division: BangladeshDivision;
  address: string;
  phone: string;
  sr: Types.ObjectId;
  status: CustomerStatus;
};