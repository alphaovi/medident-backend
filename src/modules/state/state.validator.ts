import { z } from "zod";

const singleStateSchema = z.object({
  stateName: z.string({
    required_error: "State name is required",
  }).min(1, "State name cannot be empty"),
});

const createStateValidationSchema = z.object({
  body: z.union([
    singleStateSchema, // Single object er jonno: { stateName: "Dhaka" }
    z.array(singleStateSchema).min(1, "Array cannot be empty") // Multiple array er jonno: [ { stateName: "Dhaka" }, ... ]
  ]),
});

const updateStateValidationSchema = z.object({
  body: z.object({
    stateName: z.string().min(1, "State name cannot be empty").optional(),
  }),
});

export const StateValidation = {
  createStateValidationSchema,
  updateStateValidationSchema,
};