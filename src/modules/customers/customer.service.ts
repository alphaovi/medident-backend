import mongoose from "mongoose";
import { EmployeeModel } from "../employee/employee.model.js";
import { Customer } from "./customers.interface.js";
import { CustomerModel } from "./customer.model.js";

const createCustomerIntoDB = async (customer: Customer) => {
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const employee = await EmployeeModel.findById(customer.sr).session(
        session
      );

      if (!employee) {
        throw new Error("Employee not found");
      }

      const existingCustomer = await CustomerModel.findOne({
        $or: [{ id: customer.id }, { phone: customer.phone }],
      }).session(session);

      if (existingCustomer) {
        throw new Error("Customer id or phone number already exists");
      }

      const createdCustomer = await CustomerModel.create([customer], {
        session,
      });

      const newCustomer = createdCustomer[0];

      employee.assignCustomers.push({
        customer: newCustomer._id,
        customerId: newCustomer.id,
      });

      await employee.save({ session });
    });

    const result = await CustomerModel.findOne({
      id: customer.id,
    }).populate("sr");

    return result;
  } finally {
    await session.endSession();
  }
};

const getAllCustomersFromDB = async (division?: string) => {
  // এখানে Record<string, unknown> ব্যবহার করা হয়েছে যাতে টাইপ কনফ্লিক্ট না করে
  const filter: Record<string, unknown> = division ? { division } : {};

  const result = await CustomerModel.find(filter).populate("sr");

  return result;
};

const getSingleCustomerFromDB = async (id: string) => {
  const result = await CustomerModel.findOne({ id }).populate("sr");

  return result;
};

const updateCustomerIntoDB = async (
  id: string,
  customer: Partial<Customer>
) => {
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const existingCustomer = await CustomerModel.findOne({ id }).session(
        session
      );

      if (!existingCustomer) {
        throw new Error("Customer not found");
      }

      const oldSr = existingCustomer.sr.toString();
      const newSr = customer.sr?.toString() ?? oldSr;

      if (customer.sr && newSr !== oldSr) {
        const newEmployee = await EmployeeModel.findById(customer.sr).session(
          session
        );

        if (!newEmployee) {
          throw new Error("New employee not found");
        }

        const alreadyAssigned = newEmployee.assignCustomers.some(
          (assignedCustomer) =>
            assignedCustomer.customer.toString() ===
            existingCustomer._id.toString()
        );

        if (!alreadyAssigned) {
          newEmployee.assignCustomers.push({
            customer: existingCustomer._id,
            customerId: existingCustomer.id,
          });

          await newEmployee.save({ session });
        }

        await EmployeeModel.updateOne(
          { _id: existingCustomer.sr },
          {
            $pull: {
              assignCustomers: {
                customer: existingCustomer._id,
              },
            },
          },
          { session }
        );
      }

      if (customer.id && customer.id !== existingCustomer.id) {
        await EmployeeModel.updateMany(
          {
            "assignCustomers.customer": existingCustomer._id,
          },
          {
            $set: {
              "assignCustomers.$.customerId": customer.id,
            },
          },
          { session }
        );
      }

      await CustomerModel.findOneAndUpdate(
        { id },
        customer,
        {
          new: true,
          runValidators: true,
          session,
        }
      );
    });

    const result = await CustomerModel.findOne({
      id: customer.id ?? id,
    }).populate("sr");

    return result;
  } finally {
    await session.endSession();
  }
};

const deleteSingleCustomerFromDB = async (id: string) => {
  const session = await mongoose.startSession();

  try {
    let deletedCustomerId: mongoose.Types.ObjectId | null = null;

    await session.withTransaction(async () => {
      const customer = await CustomerModel.findOne({ id }).session(session);

      if (!customer) {
        throw new Error("Customer not found");
      }

      deletedCustomerId = customer._id;

      await EmployeeModel.updateOne(
        { _id: customer.sr },
        {
          $pull: {
            assignCustomers: {
              customer: customer._id,
            },
          },
        },
        { session }
      );

      await CustomerModel.findOneAndDelete({ id }, { session });
    });

    return deletedCustomerId;
  } finally {
    await session.endSession();
  }
};

export const CustomerServices = {
  createCustomerIntoDB,
  getAllCustomersFromDB,
  getSingleCustomerFromDB,
  updateCustomerIntoDB,
  deleteSingleCustomerFromDB,
};