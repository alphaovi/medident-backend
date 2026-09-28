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
  await validateAssignedCustomers(
    employee.assignCustomers
  );

  const result = await EmployeeModel.create(employee);

  return result.populate(
    "assignCustomers.customer"
  );
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
    await session.withTransaction(async () => {
      const existingEmployee =
        await EmployeeModel.findOne({ id }).session(
          session
        );

      if (!existingEmployee) {
        throw new Error("Employee not found");
      }

      if (employee.assignCustomers) {
        await validateAssignedCustomers(
          employee.assignCustomers,
          session
        );

        const oldCustomers =
          existingEmployee.assignCustomers;

        const newCustomers =
          employee.assignCustomers;

        const oldCustomerIds = oldCustomers.map(
          (item) => item.customer.toString()
        );

        const newCustomerIds = newCustomers.map(
          (item) => item.customer.toString()
        );

        const removedCustomerIds =
          oldCustomerIds.filter(
            (customerId) =>
              !newCustomerIds.includes(customerId)
          );

        for (const customerId of removedCustomerIds) {
          const customer =
            await CustomerModel.findById(
              customerId
            ).session(session);

          if (!customer) {
            continue;
          }

          if (
            customer.sr.toString() ===
            existingEmployee._id.toString()
          ) {
            throw new Error(
              `Customer ${customer.id} must be assigned to another employee before removing`
            );
          }
        }

        for (const assignedCustomer of newCustomers) {
          const customer =
            await CustomerModel.findById(
              assignedCustomer.customer
            ).session(session);

          if (!customer) {
            throw new Error(
              `Customer not found: ${assignedCustomer.customer}`
            );
          }

          if (
            customer.sr.toString() !==
            existingEmployee._id.toString()
          ) {
            await EmployeeModel.updateOne(
              {
                _id: customer.sr,
              },
              {
                $pull: {
                  assignCustomers: {
                    customer: customer._id,
                  },
                },
              },
              {
                session,
              }
            );

            customer.sr =
              existingEmployee._id;

            await customer.save({
              session,
            });
          }
        }
      }

      await EmployeeModel.findOneAndUpdate(
        { id },
        employee,
        {
          new: true,
          runValidators: true,
          session,
        }
      );
    });

    const result = await EmployeeModel.findOne({
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
        await EmployeeModel.findOne({ id }).session(
          session
        );

      if (!employee) {
        throw new Error("Employee not found");
      }

      if (employee.assignCustomers.length > 0) {
        throw new Error(
          "Cannot delete employee with assigned customers"
        );
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