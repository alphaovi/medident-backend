import { Schema, model } from "mongoose";
import { States } from "./state.interface.js";


const stateSchema = new Schema<States>(
  {
    stateName: {
      type: String,
      required: [true, "State name is required"],
      trim: true,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

export const State = model<States>("State", stateSchema);