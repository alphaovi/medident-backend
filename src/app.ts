import express, {
  type Express,
  type Request,
  type Response,
  type Application,
} from "express";

import cors from "cors";
import { studentRoutes } from "./modules/students/student.route.js";
import { productRoutes } from "./modules/product/product.route.js";
import { productGroupRoutes } from "./modules/productGroup/productGroup.route.js";
import { productSubgroupRoutes } from "./modules/productSubgroup/productSubgroup.route.js";
import { customerRoutes } from "./modules/customers/customer.route.js";
import { employeeRoutes } from "./modules/employee/employee.route.js";
import { saleOrderRoutes } from "./modules/salesOrder/saleOrder.route.js";
import { inventoryRoutes } from "./modules/inventory/inventory.route.js";
import { purchaseOrderRoutes } from "./modules/purchaseOrder/purchaseOrder.route.js";
import { supplierRoutes } from "./modules/suppliers/supplier.route.js";

const app: Application = express();
const port = 3000;

app.use(express.json());
app.use(cors());

app.use("/api/v1/students", studentRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/product-groups", productGroupRoutes);
app.use("/api/v1/product-subgroups", productSubgroupRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/employees", employeeRoutes);
app.use("/api/v1/customers", customerRoutes);
app.use("/api/v1/sale-orders", saleOrderRoutes);
app.use("/api/v1/inventory", inventoryRoutes);
app.use("/api/v1/purchase-orders", purchaseOrderRoutes);
app.use("/api/v1/suppliers", supplierRoutes);



const getAController = (req: Request, res: Response) => {
  res.send("After Solving problem, project is running in server successfully.");
};

app.get("/", getAController);

export default app;
