import { IAssetsGroup } from "./assetsGroup.interface.js";
import { AssetsGroup } from "./assetsGroup.model.js";

const createAssetGroupIntoDB = async (payload: IAssetsGroup) => {
  const existing = await AssetsGroup.findOne({
    groupName: { $regex: new RegExp(`^${payload.groupName.trim()}$`, "i") },
  });

  if (existing) {
    throw new Error(`Asset group "${payload.groupName}" already exists`);
  }

  const result = await AssetsGroup.create(payload);
  return result;
};

const getAllAssetGroupsFromDB = async (query: Record<string, unknown> = {}) => {
  const filter: Record<string, unknown> = {};

  if (query.isActive !== undefined) {
    filter.isActive = query.isActive === "true" || query.isActive === true;
  }

  if (typeof query.searchTerm === "string" && query.searchTerm.trim()) {
    filter.groupName = { $regex: query.searchTerm.trim(), $options: "i" };
  }

  const result = await AssetsGroup.find(filter).sort({ createdAt: -1 });
  return result;
};

const getSingleAssetGroupFromDB = async (id: string) => {
  const result = await AssetsGroup.findById(id);
  return result;
};

const updateAssetGroupIntoDB = async (
  id: string,
  payload: Partial<IAssetsGroup>
) => {
  if (payload.groupName) {
    const duplicate = await AssetsGroup.findOne({
      _id: { $ne: id },
      groupName: { $regex: new RegExp(`^${payload.groupName.trim()}$`, "i") },
    });

    if (duplicate) {
      throw new Error(`Asset group "${payload.groupName}" already exists`);
    }
  }

  const result = await AssetsGroup.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  return result;
};

const deleteAssetGroupFromDB = async (id: string) => {
  // পরবর্তীতে Asset SubGroup মডেল যুক্ত হলে ডিলিটের আগে চেক করবেন যে এই গ্রুপের আন্ডারে কোনো SubGroup আছে কি না
  const result = await AssetsGroup.findByIdAndDelete(id);
  return result;
};

export const AssetsGroupService = {
  createAssetGroupIntoDB,
  getAllAssetGroupsFromDB,
  getSingleAssetGroupFromDB,
  updateAssetGroupIntoDB,
  deleteAssetGroupFromDB,
};
