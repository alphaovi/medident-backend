import { z } from "zod";

export const registerUserValidationSchema = z.object({
  body: z.object({
    name: z.string().trim().optional(),
    firstName: z.string().trim().optional(),
    lastName: z.string().trim().optional(),
    email: z
      .string({ required_error: "Email is required" })
      .trim()
      .email("Valid email is required"),
    phone: z.string().trim().optional(),
    password: z
      .string({ required_error: "Password is required" })
      .min(6, "Password must be at least 6 characters")
      .max(20, "Password must be at most 20 characters"),
  }),
});

export const loginUserValidationSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: "Email is required" })
      .trim()
      .email("Valid email is required"),
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

export const recoverAccountValidationSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: "Email is required" })
      .trim()
      .email("Valid email is required"),
  }),
});

export const updateProfileValidationSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).optional(),
    firstName: z.string().trim().optional(),
    lastName: z.string().trim().optional(),
    phone: z.string().trim().optional(),
  }),
});