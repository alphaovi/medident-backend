import express, {
  type Request,
  type Response,
  type Application,
} from "express";

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


const app: Application = express();

app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());

// 🟢 সেফটি চেক: যদি connectDB প্রজেক্টে থাকে তবেই রান করবে, অন্যথায় মেইন কানেকশন কাজ করবে
app.use(async (req, res, next) => {
  try {
    // optional chaining দিয়ে চেক করা হলো যাতে ফাংশন না থাকলে ক্র্যাশ না করে
    const dbModule = await import("./config/config.js").catch(() => null);
    if (dbModule && typeof dbModule.connectDB === "function") {
      await dbModule.connectDB();
    }
    next();
  } catch (error) {
    console.error("Database connection middleware error:", error);
    next(); // এরর হলেও যাতে রিকোয়েস্ট ব্লক না হয়ে কন্ট্রোলারে যায়
  }
});

// All Routes
app.use("/api/v1/students", studentRoutes);
app.use("/api/v1/product-groups", productGroupRoutes);
app.use("/api/v1/product-subgroups", productSubgroupRoutes);
app.use("/api/v1/products", ProductRoutes);
app.use("/api/v1/employees", employeeRoutes);
app.use("/api/v1/customers", customerRoutes);
app.use("/api/v1/sale-orders", SalesOrderRoutes);
app.use("/api/v1/inventory", InventoryRoutes);
app.use("/api/v1/purchase-orders", PurchaseOrderRoutes);
app.use("/api/v1/suppliers", supplierRoutes);
app.use("/api/v1/stock-adjustments", stockAdjustmentRoutes);
app.use("/api/v1/states", StateRoutes);
app.use("/api/v1/sell-returns", SellReturnRoutes);

const getAController = (req: Request, res: Response) => {
  res.send("After Solving problem, project is running in server successfully.");
};

app.get("/", getAController);

export default app;