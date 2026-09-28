import { Types } from "mongoose";

export type EmployeeStatus = "Active" | "Inactive";

export type AssignCustomer = {
  customer: Types.ObjectId;
  customerId: string;
};

export type Employee = {
  id: string;
  name: string;
  designation: string;
  joiningDate: Date;
  salary: number;
  contact: string;
  status: EmployeeStatus;
  assignCustomers: AssignCustomer[];
};