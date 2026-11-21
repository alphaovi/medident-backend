import { Document } from "mongoose";

export type IBanksDetail = Document & {
  bankName: string;
  accountNo: string;
  accountName: string;
  branch?: string;
  details?: string;
  isActive?: boolean;
};