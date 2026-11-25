import { AssetsGroup } from "../assetsGroup/assetsGroup.model.js";
import { IAssetsSubGroup } from "./assetsSubGroup.interface.js";
import { AssetsSubGroup } from "./assetsSubGroup.model.js";

const createAssetSubGroupIntoDB = async (payload: IAssetsSubGroup) => {
  // ১. চেক করা হচ্ছে প্রদত্ত groupId আসলেই AssetsGroup কালেকশনে আছে কি না
  const parentGroup = await AssetsGroup.findById(payload.groupId);
  if (!parentGroup) {
    throw new Error("Referenced Asset Group does not exist");
  }

  // ২. একই Group-এর অধীনে ডুপ্লিকেট subGroupName আছে কি না চেক
  const existing = await AssetsSubGroup.findOne({
    groupId: payload.groupId,
    subGroupName: {
      $regex: new RegExp(`^${payload.subGroupName.trim()}$`, "i"),
    },
  });

  if (existing) {
    throw new Error(
      `Sub-group "${payload.subGroupName}" already exists under "${parentGroup.groupName}"`
    );
  }

  const created = await AssetsSubGroup.create(payload);
  return await created.populate("groupId", "groupName isActive");
};

const getAllAssetSubGroupsFromDB = async (
  query: Record<string, unknown> = {}
) => {
  const filter: Record<string, unknown> = {};

  // নির্দিষ্ট কোনো Group-এর সব SubGroup ফিল্টার করতে (?groupId=...)
  if (typeof query.groupId === "string" && query.groupId.trim()) {
    filter.groupId = query.groupId.trim();
  }

  if (query.isActive !== undefined) {
    filter.isActive = query.isActive === "true" || query.isActive === true;
  }

  if (typeof query.searchTerm === "string" && query.searchTerm.trim()) {
    filter.subGroupName = { $regex: query.searchTerm.trim(), $options: "i" };
  }

  const result = await AssetsSubGroup.find(filter)
    .populate("groupId", "groupName isActive")
    .sort({ createdAt: -1 });

  return result;
};

const getSingleAssetSubGroupFromDB = async (id: string) => {
  const result = await AssetsSubGroup.findById(id).populate(
    "groupId",
    "groupName description isActive"
  );
  return result;
};

const getSubGroupsByGroupIdFromDB = async (groupId: string) => {
  const result = await AssetsSubGroup.find({ groupId })
    .populate("groupId", "groupName isActive")
    .sort({ subGroupName: 1 });

  return result;
};

const updateAssetSubGroupIntoDB = async (
  id: string,
  payload: Partial<IAssetsSubGroup>
) => {
  const currentDoc = await AssetsSubGroup.findById(id);
  if (!currentDoc) {
    return null;
  }

  const targetGroupId = payload.groupId || currentDoc.groupId;
  const targetSubGroupName = payload.subGroupName || currentDoc.subGroupName;

  if (payload.groupId) {
    const parentGroup = await AssetsGroup.findById(payload.groupId);
    if (!parentGroup) {
      throw new Error("Referenced Asset Group does not exist");
    }
  }

  if (payload.groupId || payload.subGroupName) {
    const duplicate = await AssetsSubGroup.findOne({
      _id: { $ne: id },
      groupId: targetGroupId,
      subGroupName: {
        $regex: new RegExp(`^${targetSubGroupName.trim()}$`, "i"),
      },
    });

    if (duplicate) {
      throw new Error(
        `Sub-group "${targetSubGroupName}" already exists in this group`
      );
    }
  }

  const result = await AssetsSubGroup.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  }).populate("groupId", "groupName isActive");

  return result;
};

const deleteAssetSubGroupFromDB = async (id: string) => {
  const result = await AssetsSubGroup.findByIdAndDelete(id);
  return result;
};

export const AssetsSubGroupService = {
  createAssetSubGroupIntoDB,
  getAllAssetSubGroupsFromDB,
  getSingleAssetSubGroupFromDB,
  getSubGroupsByGroupIdFromDB,
  updateAssetSubGroupIntoDB,
  deleteAssetSubGroupFromDB,
};
