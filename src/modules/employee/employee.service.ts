import mongoose from "mongoose";

import { Employee } from "./employee.interface.js";
import { EmployeeModel } from "./employee.model.js";
import { CustomerModel } from "../customers/customer.model.js";

const validateAssignedCustomers = async (
  assignCustomers: Employee["assignCustomers"],
  session?: mongoose.ClientSession
) => {
  for (const assignedCustomer of assignCustomers) {
    const customer = await CustomerModel.findById(
      assignedCustomer.customer
    ).session(session ?? null);

    if (!customer) {
      throw new Error(
        `Customer not found: ${assignedCustomer.customer}`
      );
    }

    if (customer.id !== assignedCustomer.customerId) {
      throw new Error(
        `Customer ObjectId and Customer id do not match: ${assignedCustomer.customerId}`
      );
    }
  }
};

const createEmployeeIntoDB = async (
  employee: Employee
) => {
  if (employee.assignCustomers && employee.assignCustomers.length > 0) {
    await validateAssignedCustomers(employee.assignCustomers);
  }

  const result = await EmployeeModel.create(employee);

  // Update customer sr reference for created employee
  if (employee.assignCustomers && employee.assignCustomers.length > 0) {
    for (const item of employee.assignCustomers) {
      await CustomerModel.findByIdAndUpdate(item.customer, {
        sr: result._id,
      });
    }
  }

  return result.populate("assignCustomers.customer");
};

const getAllEmployeesFromDB = async () => {
  const result = await EmployeeModel.find().populate(
    "assignCustomers.customer"
  );

  return result;
};

const getSingleEmployeeFromDB = async (
  id: string
) => {
  const result = await EmployeeModel.findOne({
    id,
  }).populate("assignCustomers.customer");

  return result;
};

const updateEmployeeIntoDB = async (
  id: string,
  employee: Partial<Employee>
) => {
  const session = await mongoose.startSession();

  try {
    let result = null;
    await session.withTransaction(async () => {
      const existingEmployee =
        await EmployeeModel.findOne({ id }).session(session);

      if (!existingEmployee) {
        throw new Error("Employee not found");
      }

      if (employee.assignCustomers) {
        await validateAssignedCustomers(
          employee.assignCustomers,
          session
        );

        const newCustomers = employee.assignCustomers || [];
        const oldCustomers = existingEmployee.assignCustomers || [];

        const oldCustomerIds = oldCustomers.map(
          (item) => (item.customer ? item.customer.toString() : "")
        );

        const newCustomerIds = newCustomers.map(
          (item) => (item.customer ? item.customer.toString() : "")
        );

        // 1. Release customers that were removed
        const removedCustomerIds = oldCustomerIds.filter(
          (customerId) => customerId && !newCustomerIds.includes(customerId)
        );

        for (const customerId of removedCustomerIds) {
          await CustomerModel.findByIdAndUpdate(
            customerId,
            { $set: { sr: null } },
            { session }
          );
        }

        // 2. Assign new customers and update their sr reference
        for (const assignedCustomer of newCustomers) {
          const customerDoc = await CustomerModel.findById(
            assignedCustomer.customer
          ).session(session);

          if (!customerDoc) {
            throw new Error(
              `Customer not found: ${assignedCustomer.customer}`
            );
          }

          customerDoc.sr = existingEmployee._id;
          await customerDoc.save({ session });
        }
      }

      result = await EmployeeModel.findOneAndUpdate(
        { id },
        employee,
        {
          new: true,
          runValidators: true,
          session,
        }
      );
    });

    result = await EmployeeModel.findOne({
      id,
    }).populate("assignCustomers.customer");

    return result;
  } finally {
    await session.endSession();
  }
};

const deleteSingleEmployeeFromDB = async (
  id: string
) => {
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const employee =
        await EmployeeModel.findOne({ id }).session(session);

      if (!employee) {
        throw new Error("Employee not found");
      }

      if (employee.assignCustomers && employee.assignCustomers.length > 0) {
        // Free up associated customers sr reference before deleting
        for (const item of employee.assignCustomers) {
          await CustomerModel.findByIdAndUpdate(
            item.customer,
            { $set: { sr: null } },
            { session }
          );
        }
      }

      await EmployeeModel.findOneAndDelete(
        { id },
        { session }
      );
    });

    return true;
  } finally {
    await session.endSession();
  }
};

export const EmployeeServices = {
  createEmployeeIntoDB,
  getAllEmployeesFromDB,
  getSingleEmployeeFromDB,
  updateEmployeeIntoDB,
  deleteSingleEmployeeFromDB,
};