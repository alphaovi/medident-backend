import { Document } from "mongoose";

export type IAssetsGroup = {
  groupName: string;
  description?: string;
  isActive?: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

export type IAssetsGroupDocument = IAssetsGroup & Document;