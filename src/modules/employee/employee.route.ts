import express from "express";
import { EmployeeControllers } from "./employee.controller.js";
import validateRequest from "../../middlewares/validateRequest.js";
import {
  createEmployeeValidationSchema,
  updateEmployeeValidationSchema,
} from "./employee.validator.js";

const router = express.Router();

router.post(
  "/create-employee",
  validateRequest(createEmployeeValidationSchema),
  EmployeeControllers.createEmployee
);

router.get(
  "/",
  EmployeeControllers.getAllEmployees
);

router.get(
  "/:id",
  EmployeeControllers.getSingleEmployee
);

router.patch(
  "/:id",
  validateRequest(updateEmployeeValidationSchema),
  EmployeeControllers.updateEmployee
);

router.delete(
  "/:id",
  EmployeeControllers.deleteSingleEmployee
);

export const employeeRoutes = router;