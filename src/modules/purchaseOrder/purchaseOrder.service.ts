import mongoose from "mongoose";

import { ProductModel } from "../product/product.model.js";
import { ProductGroupModel } from "../productGroup/productGroup.model.js";
import { ProductSubgroupModel } from "../productSubgroup/productSubgroup.model.js";
import { PurchaseOrderModel } from "./purchaseOrder.model.js";

type CreatePurchaseOrderPayload = {
  purchaseId: string;

  purchaseDate: string | Date;

  expectedDeliveryDate: string | Date;

  supplierName: string;

  items: {
    group: string;
    subGroup: string;
    product: string;
    orderQuantity: number;
    weight: number;
    price: number;
  }[];

  shippingCost?: number;
  transitCost?: number;

  vatType?: "%" | "flat";
  vatValue?: number;

  otherCost?: number;
};

const roundNumber = (value: number) => {
  return Math.round(
    (value + Number.EPSILON) * 100
  ) / 100;
};

const getPurchaseOrderById = async (
  id: string
) => {
  return await PurchaseOrderModel.findById(id)
    .populate({
      path: "supplierName",
    })
    .populate({
      path: "items.group",
      select: "_id id groupName",
    })
    .populate({
      path: "items.subGroup",
      select: "_id id subGroupName group",
    })
    .populate({
      path: "items.product",
      select:
        "_id id name stock purchasePrice sellingPrice weight unit",
    });
};

const createPurchaseOrderIntoDB = async (
  payload: CreatePurchaseOrderPayload
) => {
  const session =
    await mongoose.startSession();

  try {
    session.startTransaction();

    const existingPurchase =
      await PurchaseOrderModel.findOne({
        purchaseId: payload.purchaseId,
      }).session(session);

    if (existingPurchase) {
      throw new Error(
        "Purchase ID already exists"
      );
    }

    const shippingCost =
      payload.shippingCost ?? 0;

    const transitCost =
      payload.transitCost ?? 0;

    const vatValue =
      payload.vatValue ?? 0;

    const otherCost =
      payload.otherCost ?? 0;

    if (shippingCost < 0) {
      throw new Error(
        "Shipping cost cannot be negative"
      );
    }

    if (transitCost < 0) {
      throw new Error(
        "Transit cost cannot be negative"
      );
    }

    if (vatValue < 0) {
      throw new Error(
        "VAT cannot be negative"
      );
    }

    if (otherCost < 0) {
      throw new Error(
        "Other cost cannot be negative"
      );
    }

    const totalWeight =
      payload.items.reduce(
        (sum, item) =>
          sum + item.weight,
        0
      );

    if (totalWeight <= 0) {
      throw new Error(
        "Total weight must be greater than 0"
      );
    }

    const baseSubtotal =
      payload.items.reduce(
        (sum, item) =>
          sum +
          item.price *
            item.orderQuantity,
        0
      );

    const calculatedItems = [];

    for (const item of payload.items) {
      const group =
        await ProductGroupModel.findOne({
          id: item.group,
        }).session(session);

      if (!group) {
        throw new Error(
          `Group not found: ${item.group}`
        );
      }

      const subGroup =
        await ProductSubgroupModel.findOne({
          id: item.subGroup,
        }).session(session);

      if (!subGroup) {
        throw new Error(
          `Sub-group not found: ${item.subGroup}`
        );
      }

      if (
        subGroup.group.toString() !==
        group._id.toString()
      ) {
        throw new Error(
          "Selected sub-group does not belong to selected group"
        );
      }

      const product =
        await ProductModel.findOne({
          id: item.product,
        }).session(session);

      if (!product) {
        throw new Error(
          `Product not found: ${item.product}`
        );
      }

      if (
        product.group.toString() !==
        group._id.toString()
      ) {
        throw new Error(
          "Selected product does not belong to selected group"
        );
      }

      if (
        product.subGroup.toString() !==
        subGroup._id.toString()
      ) {
        throw new Error(
          "Selected product does not belong to selected sub-group"
        );
      }

      const currentStock =
        product.stock ?? 0;

      const inTransit =
        await getProductInTransit(
          product._id,
          session
        );

      const itemBaseTotal =
        item.price *
        item.orderQuantity;

      const shippingAllocation =
        shippingCost *
        (item.weight / totalWeight);

      let itemVat = 0;

      if (payload.vatType === "%") {
        itemVat =
          (itemBaseTotal +
            shippingAllocation) *
          (vatValue / 100);
      } else {
        itemVat = 0;
      }

      const itemCount =
        payload.items.length;

      const itemTransitCost =
        transitCost / itemCount;

      const itemOtherCost =
        otherCost / itemCount;

      let itemFlatVat = 0;

      if (payload.vatType === "flat") {
        itemFlatVat =
          vatValue / itemCount;
      }

      const finalVat =
        itemVat + itemFlatVat;

      const totalItemCost =
        itemBaseTotal +
        shippingAllocation +
        finalVat +
        itemTransitCost +
        itemOtherCost;

      const unitCost =
        totalItemCost /
        item.orderQuantity;

      calculatedItems.push({
        group: group._id,
        subGroup: subGroup._id,
        product: product._id,

        currentStock,

        inTransit,

        orderQuantity:
          item.orderQuantity,

        price: item.price,

        weight: item.weight,

        shippingCost:
          roundNumber(
            shippingAllocation
          ),

        vatAmount:
          roundNumber(finalVat),

        transitCost:
          roundNumber(
            itemTransitCost
          ),

        otherCost:
          roundNumber(
            itemOtherCost
          ),

        unitCost:
          roundNumber(unitCost),

        totalCost:
          roundNumber(totalItemCost),

        status: "Pending" as const,
      });
    }

    const grandTotal =
      calculatedItems.reduce(
        (sum, item) =>
          sum + item.totalCost,
        0
      );

    const createdPurchaseOrder =
      await PurchaseOrderModel.create(
        [
          {
            purchaseId:
              payload.purchaseId,

            purchaseDate:
              new Date(
                payload.purchaseDate
              ),

            expectedDeliveryDate:
              new Date(
                payload.expectedDeliveryDate
              ),

            supplierName:
              payload.supplierName,

            items: calculatedItems,

            shippingCost:
              roundNumber(
                shippingCost
              ),

            transitCost:
              roundNumber(
                transitCost
              ),

            vatType:
              payload.vatType ?? "%",

            vatValue:
              roundNumber(vatValue),

            otherCost:
              roundNumber(otherCost),

            totalWeight:
              roundNumber(totalWeight),

            baseSubtotal:
              roundNumber(
                baseSubtotal
              ),

            grandTotal:
              roundNumber(grandTotal),

            status: "Pending",
          },
        ],
        { session }
      );

    await session.commitTransaction();

    return await getPurchaseOrderById(
      createdPurchaseOrder[0]._id.toString()
    );
  } catch (error) {
    await session.abortTransaction();

    throw error;
  } finally {
    await session.endSession();
  }
};

const getProductInTransit = async (
  productId: mongoose.Types.ObjectId,
  session: mongoose.ClientSession
) => {
  const result =
    await PurchaseOrderModel.aggregate([
      {
        $match: {
          "items.product": productId,
        },
      },

      {
        $unwind: "$items",
      },

      {
        $match: {
          "items.product": productId,
          "items.status": {
            $ne: "Received",
          },
        },
      },

      {
        $group: {
          _id: null,

          total: {
            $sum:
              "$items.orderQuantity",
          },
        },
      },
    ]).session(session);

  return result[0]?.total ?? 0;
};

const getAllPurchaseOrdersFromDB =
  async () => {
    return await PurchaseOrderModel.find()
      .populate("supplierName")
      .populate({
        path: "items.group",
        select: "_id id groupName",
      })
      .populate({
        path: "items.subGroup",
        select: "_id id subGroupName",
      })
      .populate({
        path: "items.product",
        select:
          "_id id name stock purchasePrice sellingPrice",
      })
      .sort({
        createdAt: -1,
      });
  };

const getSinglePurchaseOrderFromDB =
  async (purchaseId: string) => {
    const result =
      await PurchaseOrderModel.findOne({
        purchaseId,
      })
        .populate("supplierName")
        .populate({
          path: "items.group",
          select: "_id id groupName",
        })
        .populate({
          path: "items.subGroup",
          select:
            "_id id subGroupName",
        })
        .populate({
          path: "items.product",
          select:
            "_id id name stock purchasePrice sellingPrice",
        });

    if (!result) {
      throw new Error(
        "Purchase order not found"
      );
    }

    return result;
  };

const receivePurchaseOrder = async (
  purchaseId: string
) => {
  const session =
    await mongoose.startSession();

  try {
    session.startTransaction();

    const purchaseOrder =
      await PurchaseOrderModel.findOne({
        purchaseId,
      }).session(session);

    if (!purchaseOrder) {
      throw new Error(
        "Purchase order not found"
      );
    }

    if (
      purchaseOrder.status === "Received"
    ) {
      throw new Error(
        "Purchase order already received"
      );
    }

    for (const item of purchaseOrder.items) {
      if (item.status === "Received") {
        continue;
      }

      const product =
        await ProductModel.findById(
          item.product
        ).session(session);

      if (!product) {
        throw new Error(
          "Product not found while receiving purchase order"
        );
      }

      const oldStock =
        product.stock ?? 0;

      const newStock =
        oldStock +
        item.orderQuantity;

      product.stock = newStock;

      /*
       * Weighted average buying price.
       *
       * Existing stock uses existing purchasePrice.
       * New received stock uses landed unitCost.
       */
      const existingPurchaseValue =
        oldStock *
        (product.purchasePrice ?? 0);

      const newPurchaseValue =
        item.orderQuantity *
        item.unitCost;

      const totalQuantity =
        oldStock +
        item.orderQuantity;

      if (totalQuantity > 0) {
        product.purchasePrice =
          roundNumber(
            (existingPurchaseValue +
              newPurchaseValue) /
              totalQuantity
          );
      }

      await product.save({
        session,
      });

      item.status = "Received";
      item.inTransit = 0;
      item.currentStock =
        newStock;
    }

    const allReceived =
      purchaseOrder.items.every(
        (item) =>
          item.status === "Received"
      );

    purchaseOrder.status =
      allReceived
        ? "Received"
        : "Partially Received";

    await purchaseOrder.save({
      session,
    });

    await session.commitTransaction();

    return await getPurchaseOrderById(
      purchaseOrder._id.toString()
    );
  } catch (error) {
    await session.abortTransaction();

    throw error;
  } finally {
    await session.endSession();
  }
};

export const PurchaseOrderServices = {
  createPurchaseOrderIntoDB,
  getAllPurchaseOrdersFromDB,
  getSinglePurchaseOrderFromDB,
  receivePurchaseOrder,
};