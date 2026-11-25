import express, { type Request, type Response, type Application } from "express";
import cors from "cors";

import { studentRoutes } from "./modules/students/student.route.js";
import { productGroupRoutes } from "./modules/productGroup/productGroup.route.js";
import { productSubgroupRoutes } from "./modules/productSubgroup/productSubgroup.route.js";
import { customerRoutes } from "./modules/customers/customer.route.js";
import { employeeRoutes } from "./modules/employee/employee.route.js";
import { supplierRoutes } from "./modules/suppliers/supplier.route.js";
import { PurchaseOrderRoutes } from "./modules/purchaseOrder/purchaseOrder.route.js";
import { ProductRoutes } from "./modules/product/product.route.js";
import { InventoryRoutes } from "./modules/inventory/inventory.route.js";
import { stockAdjustmentRoutes } from "./modules/stockAdjustment/stockAdjustment.route.js";
import { StateRoutes } from "./modules/state/state.route.js";
import { SellReturnRoutes } from "./modules/sellReturn/sellReturn.route.js";
import { SalesOrderRoutes } from "./modules/salesOrder/salesOrder.route.js";
import { BanksDetailRoutes } from "./modules/banksDetail/banksDetail.route.js";
import { UserRoutes } from "./modules/user/user.route.js";
import { ExpenseGroupRoutes } from "./modules/expenseGroup/expenseGroup.route.js";
import { ExpenseTypeRoutes } from "./modules/expenseType/expenseType.route.js";
import { ExpenseRoutes } from "./modules/expense/expense.route.js";
import { AssetsGroupRoutes } from "./modules/assetsGroup/assetsGroup.route.js";
import { AssetsSubGroupRoutes } from "./modules/assetsSubGroup/assetsSubGroup.route.js";
import { AssetsSellRoutes } from "./modules/assetsSell/assetsSell.route.js";
import { AssetsRoutes } from "./modules/assets/assets.route.js";

const app: Application = express();

// 🟢 সঠিক CORS কনফিগারেশন
app.use(cors({
  origin: true,
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// All Routes
app.use("/api/v1/students", studentRoutes);
app.use("/api/v1/product-groups", productGroupRoutes);
app.use("/api/v1/product-subgroups", productSubgroupRoutes);
app.use("/api/v1/products", ProductRoutes);
app.use("/api/v1/employees", employeeRoutes);
app.use("/api/v1/customers", customerRoutes);
app.use("/api/v1/sales-orders", SalesOrderRoutes);
app.use("/api/v1/inventory", InventoryRoutes);
app.use("/api/v1/purchase-orders", PurchaseOrderRoutes);
app.use("/api/v1/suppliers", supplierRoutes);
app.use("/api/v1/stock-adjustments", stockAdjustmentRoutes);
app.use("/api/v1/states", StateRoutes);
app.use("/api/v1/sell-returns", SellReturnRoutes);
app.use("/api/v1/banks-detail",BanksDetailRoutes);
app.use("/api/v1/users",UserRoutes);
app.use("/api/v1/expense", ExpenseRoutes);
app.use("/api/v1/expense-group",ExpenseGroupRoutes);
app.use("/api/v1/expense-type", ExpenseTypeRoutes);
app.use("/api/v1/assets", AssetsRoutes);
app.use("/api/v1/assets-group", AssetsGroupRoutes);
app.use("/api/v1/assets-sub-group", AssetsSubGroupRoutes);
app.use("/api/v1/assets-sell", AssetsSellRoutes);


app.get("/", (req: Request, res: Response) => {
  res.status(200).send("Medident Backend is running successfully!");
});

// 🟢 গ্লোবাল এরর হ্যান্ডলার (সার্ভার ক্র্যাশ রোধ করতে)
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error("❌ [GLOBAL ERROR]:", err.stack || err.message);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

export default app;