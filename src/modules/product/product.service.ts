import { ProductGroupModel } from "../productGroup/productGroup.model.js";
import { ProductSubgroupModel } from "../productSubgroup/productSubgroup.model.js";
import { ProductDetails } from "./product.interface.js";
import { ProductModel } from "./product.model.js";

const validateGroupAndSubgroup = async (
  group: string,
  subGroup: string
) => {
  const productGroup =
    await ProductGroupModel.findById(group);

  if (!productGroup) {
    throw new Error(
      "Product group not found"
    );
  }

  const productSubgroup =
    await ProductSubgroupModel.findOne({
      _id: subGroup,
      group: group,
    });

  if (!productSubgroup) {
    throw new Error(
      "Product subgroup does not belong to the selected product group"
    );
  }
};

const CreateProductIntoDB = async (
  productDetails: ProductDetails
) => {
  await validateGroupAndSubgroup(
    productDetails.group.toString(),
    productDetails.subGroup.toString()
  );

  const result = await ProductModel.create(
    productDetails
  );

  return result.populate([
    "group",
    "subGroup",
  ]);
};

const getAllProductsFromDB = async () => {
  const result = await ProductModel.find()
    .populate("group")
    .populate("subGroup");

  return result;
};

const getSingleProductFromDB = async (
  id: string
) => {
  const result = await ProductModel.findOne({
    id,
  })
    .populate("group")
    .populate("subGroup");

  return result;
};

const updateProductIntoDB = async (
  id: string,
  productDetails: Partial<ProductDetails>
) => {
  const existingProduct =
    await ProductModel.findOne({ id });

  if (!existingProduct) {
    throw new Error("Product not found");
  }

  const group =
    productDetails.group?.toString() ??
    existingProduct.group.toString();

  const subGroup =
    productDetails.subGroup?.toString() ??
    existingProduct.subGroup.toString();

  await validateGroupAndSubgroup(
    group,
    subGroup
  );

  const result =
    await ProductModel.findOneAndUpdate(
      { id },
      productDetails,
      {
        new: true,
        runValidators: true,
      }
    )
      .populate("group")
      .populate("subGroup");

  return result;
};

const deleteSingleProductFromDB = async (
  id: string
) => {
  const result =
    await ProductModel.findOneAndDelete({
      id,
    });

  return result;
};

export const ProductDetailsServices = {
  CreateProductIntoDB,
  getAllProductsFromDB,
  getSingleProductFromDB,
  updateProductIntoDB,
  deleteSingleProductFromDB,
};