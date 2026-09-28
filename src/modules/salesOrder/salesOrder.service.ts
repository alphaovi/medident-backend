import mongoose from "mongoose";

import { ProductModel } from "../product/product.model.js";
import { ProductGroupModel } from "../productGroup/productGroup.model.js";
import { ProductSubgroupModel } from "../productSubgroup/productSubgroup.model.js";
import { CustomerModel } from "../customers/customer.model.js";
import { SaleOrderModel } from "./salesOrder.model.js";

type CreateSaleOrderPayload = {
  stateOrRegion: string;

  customer: string;

  orderDate: string | Date;

  products: {
    group: string;
    subGroup: string;
    product: string;
    quantity: number;
    discount?: number;
  }[];

  generalDiscountType?: "%" | "flat";

  generalDiscountValue?: number;

  paidAmount: number;
};

const roundNumber = (
  value: number
) => {
  return Math.round(
    (value + Number.EPSILON) * 100
  ) / 100;
};

const getSaleOrderById = async (
  id: string
) => {
  const result =
    await SaleOrderModel.findById(id)
      .populate({
        path: "customer",
        select:
          "_id id name division address phone sr status",
      })
      .populate({
        path: "products.group",
        select:
          "_id id groupName",
      })
      .populate({
        path: "products.subGroup",
        select:
          "_id id subGroupName group",
      })
      .populate({
        path: "products.product",
        select:
          "_id id name sellingPrice purchasePrice stock unit weight group subGroup",
      });

  return result;
};

const createSaleOrderIntoDB =
  async (
    payload: CreateSaleOrderPayload
  ) => {
    const session =
      await mongoose.startSession();

    try {
      session.startTransaction();

      const customer =
        await CustomerModel.findOne({
          id: payload.customer,
        }).session(session);

      if (!customer) {
        throw new Error(
          `Customer not found: ${payload.customer}`
        );
      }

      if (
        !payload.products ||
        payload.products.length === 0
      ) {
        throw new Error(
          "At least one product is required"
        );
      }

      if (
        payload.paidAmount < 0
      ) {
        throw new Error(
          "Paid amount cannot be negative"
        );
      }

      const calculatedProducts =
        [];

      let productsSubtotal = 0;

      for (
        const item of payload.products
      ) {
        if (
          item.quantity <= 0
        ) {
          throw new Error(
            "Product quantity must be greater than 0"
          );
        }

        const group =
          await ProductGroupModel.findOne(
            {
              id: item.group,
            }
          ).session(session);

        if (!group) {
          throw new Error(
            `Group not found: ${item.group}`
          );
        }

        const subGroup =
          await ProductSubgroupModel.findOne(
            {
              id: item.subGroup,
            }
          ).session(session);

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

        const productStock =
          product.stock;

        if (
          productStock <
          item.quantity
        ) {
          throw new Error(
            `Insufficient stock for ${product.name}. Available stock: ${productStock}`
          );
        }

        const price =
          product.sellingPrice;

        const totalPrice =
          roundNumber(
            price * item.quantity
          );

        const itemDiscount =
          roundNumber(
            item.discount ?? 0
          );

        if (
          itemDiscount < 0
        ) {
          throw new Error(
            `Discount cannot be negative for ${product.name}`
          );
        }

        if (
          itemDiscount >
          totalPrice
        ) {
          throw new Error(
            `Discount cannot be greater than total price for ${product.name}`
          );
        }

        const afterDiscount =
          roundNumber(
            totalPrice -
              itemDiscount
          );

        productsSubtotal =
          roundNumber(
            productsSubtotal +
              afterDiscount
          );

        calculatedProducts.push({
          group: group._id,

          subGroup:
            subGroup._id,

          product:
            product._id,

          quantity:
            item.quantity,

          price,

          discount:
            itemDiscount,

          totalPrice,

          afterDiscount,
        });
      }

      let generalDiscount = 0;

      const generalDiscountValue =
        payload.generalDiscountValue ??
        0;

      if (
        generalDiscountValue < 0
      ) {
        throw new Error(
          "General discount cannot be negative"
        );
      }

      if (
        generalDiscountValue > 0
      ) {
        if (
          payload.generalDiscountType ===
          "%"
        ) {
          if (
            generalDiscountValue >
            100
          ) {
            throw new Error(
              "Percentage discount cannot be greater than 100%"
            );
          }

          generalDiscount =
            roundNumber(
              (productsSubtotal *
                generalDiscountValue) /
                100
            );
        } else if (
          payload.generalDiscountType ===
          "flat"
        ) {
          generalDiscount =
            roundNumber(
              generalDiscountValue
            );
        } else {
          throw new Error(
            "Invalid general discount type"
          );
        }
      }

      if (
        generalDiscount >
        productsSubtotal
      ) {
        throw new Error(
          "General discount cannot be greater than order total"
        );
      }

      const grandTotal =
        roundNumber(
          productsSubtotal -
            generalDiscount
        );

      if (
        payload.paidAmount >
        grandTotal
      ) {
        throw new Error(
          "Paid amount cannot be greater than grand total"
        );
      }

      const dueAmount =
        roundNumber(
          grandTotal -
            payload.paidAmount
        );

      const createdOrder =
        await SaleOrderModel.create(
          [
            {
              stateOrRegion:
                payload.stateOrRegion,

              customer:
                customer._id,

              orderDate:
                new Date(
                  payload.orderDate
                ),

              products:
                calculatedProducts,

              generalDiscountType:
                payload.generalDiscountType,

              generalDiscountValue,

              paidAmount:
                payload.paidAmount,

              grandTotal,

              dueAmount,
            },
          ],
          {
            session,
          }
        );

      for (
        const item of calculatedProducts
      ) {
        const updatedProduct =
          await ProductModel.findOneAndUpdate(
            {
              _id: item.product,

              stock: {
                $gte:
                  item.quantity,
              },
            },
            {
              $inc: {
                stock:
                  -item.quantity,
              },
            },
            {
              new: true,
              session,
            }
          );

        if (!updatedProduct) {
          throw new Error(
            "Stock changed while creating order. Please try again."
          );
        }
      }

      await session.commitTransaction();

      return await getSaleOrderById(
        createdOrder[0]._id.toString()
      );
    } catch (error) {
      await session.abortTransaction();

      throw error;
    } finally {
      await session.endSession();
    }
  };

export const SaleOrderServices = {
  createSaleOrderIntoDB,
  getSaleOrderById,
};