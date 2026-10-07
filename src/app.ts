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
import { saleOrderRoutes } from "./modules/salesOrder/saleOrder.route.js";
import { supplierRoutes } from "./modules/suppliers/supplier.route.js";
import { PurchaseOrderRoutes } from "./modules/purchaseOrder/purchaseOrder.route.js";
import { ProductRoutes } from "./modules/product/product.route.js";
import { InventoryRoutes } from "./modules/inventory/inventory.route.js";
import { stockAdjustmentRoutes } from "./modules/stockAdjustment/stockAdjustment.route.js";
import { connectDB } from "./config/config.js";

const app: Application = express();

app.use(
  cors({
    origin: "*", // সাময়িকভাবে সব অরিজিন এলাউ করার জন্য, অথবা 'http://localhost:5173' দিতে পারো
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
// Vercel সার্ভারলেসের জন্য প্রতিটি রিকোয়েস্টে ডাটাবেজ কানেকশন নিশ্চিত করার মিডলওয়্যার
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Database connection failed",
      error: error instanceof Error ? error.message : error,
    });
  }
});

// All Routes
app.use("/api/v1/students", studentRoutes);
app.use("/api/v1/product-groups", productGroupRoutes);
app.use("/api/v1/product-subgroups", productSubgroupRoutes);
app.use("/api/v1/products", ProductRoutes);
app.use("/api/v1/employees", employeeRoutes);
app.use("/api/v1/customers", customerRoutes);
app.use("/api/v1/sale-orders", saleOrderRoutes);
app.use("/api/v1/inventory", InventoryRoutes);
app.use("/api/v1/purchase-orders", PurchaseOrderRoutes);
app.use("/api/v1/suppliers", supplierRoutes);
app.use("/api/v1/stock-adjustment", stockAdjustmentRoutes);

const getAController = (req: Request, res: Response) => {
  res.send("After Solving problem, project is running in server successfully.");
};

app.get("/", getAController);

export default app;
