import { ProductModel } from "../product/product.model.js";
import { SaleOrderModel } from "../salesOrder/salesOrder.model.js";


const getAllInventoryFromDB = async () => {
  const products = await ProductModel.find()
    .select(
      "_id id name sellingPrice stock purchasePrice"
    )
    .lean();

  const inventory = await Promise.all(
    products.map(async (product) => {
      const saleResult = await SaleOrderModel.aggregate([
        {
          $unwind: "$products",
        },
        {
          $match: {
            "products.product": product._id,
          },
        },
        {
          $group: {
            _id: null,
            totalSell: {
              $sum: "$products.quantity",
            },
          },
        },
      ]);

      const totalSell = saleResult[0]?.totalSell ?? 0;

      const currentStock = product.stock ?? 0;

      const totalStock = currentStock + totalSell;

      const avgBuyingPrice = product.purchasePrice ?? 0;

      const totalStockValue =
        totalStock * avgBuyingPrice;

      const totalSaleValue =
        totalSell * product.sellingPrice;

      return {
        product: product._id,
        totalStock,
        totalSell,
        currentStock,
        avgBuyingPrice,
        totalStockValue,
        totalSaleValue,
      };
    })
  );

  return inventory;
};

const getSingleInventoryFromDB = async (
  productId: string
) => {
  const product = await ProductModel.findOne({
    id: productId,
  })
    .select(
      "_id id name sellingPrice stock purchasePrice"
    )
    .lean();

  if (!product) {
    throw new Error("Product not found");
  }

  const saleResult = await SaleOrderModel.aggregate([
    {
      $unwind: "$products",
    },
    {
      $match: {
        "products.product": product._id,
      },
    },
    {
      $group: {
        _id: null,
        totalSell: {
          $sum: "$products.quantity",
        },
      },
    },
  ]);

  const totalSell = saleResult[0]?.totalSell ?? 0;

  const currentStock = product.stock ?? 0;

  const totalStock = currentStock + totalSell;

  const avgBuyingPrice = product.purchasePrice ?? 0;

  const totalStockValue =
    totalStock * avgBuyingPrice;

  const totalSaleValue =
    totalSell * product.sellingPrice;

  return {
    product: product._id,
    totalStock,
    totalSell,
    currentStock,
    avgBuyingPrice,
    totalStockValue,
    totalSaleValue,
  };
};

export const InventoryServices = {
  getAllInventoryFromDB,
  getSingleInventoryFromDB,
};