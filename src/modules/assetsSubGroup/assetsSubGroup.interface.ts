import { Document, Types } from "mongoose";

export type IAssetsSubGroup = {
  groupId: Types.ObjectId;
  subGroupName: string;
  description?: string;
  isActive?: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

export type IAssetsSubGroupDocument = IAssetsSubGroup & Document;