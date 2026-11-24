import { Document, Schema, Types } from "mongoose";

export type IBankTransactionType =
  | "deposit"
  | "transfer_in"
  | "transfer_out"
  | "expense";

export type IBankTransactionDirection = "in" | "out";

export type IBankTransaction = {
  bankAccount: Schema.Types.ObjectId;
  type: IBankTransactionType;
  direction: IBankTransactionDirection;
  amount: number;
  date: Date;
  fromAccount?: Schema.Types.ObjectId | null;
  toAccount?: Schema.Types.ObjectId | null;
  referenceId?: Schema.Types.ObjectId | null;
  note?: string;
};

export type IBanksDetail = Document & {
  user: Types.ObjectId;
  bankName: string;
  accountNo?: string;
  accountName: string;
  branch?: string;
  details?: string;
  isActive?: boolean;
  currentBalance: number;
  transactions: IBankTransaction[];
};