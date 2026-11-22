import { z } from "zod";

export const registerUserValidationSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    email: z.string({ required_error: "Email is required" }).email("Valid email is required"),
    phone: z.string().optional(),
    password: z.string({ required_error: "Password is required" }).min(6, "Password must be at least 6 characters"),
  }),
});

export const loginUserValidationSchema = z.object({
  body: z.object({
    email: z.string({ required_error: "Email is required" }).email("Valid email is required"),
    password: z.string({ required_error: "Password is required" }).min(1, "Password is required"),
  }),
});

export const approveUserValidationSchema = z.object({
  body: z.object({
    role: z.enum(["admin", "manager", "user"], {
      required_error: "Role is required",
    }),
  }),
});

export const updateUserActiveStatusValidationSchema = z.object({
  body: z.object({
    isActive: z.boolean({ required_error: "isActive boolean is required" }),
  }),
});