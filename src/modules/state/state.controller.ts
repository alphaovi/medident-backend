import { Request, Response } from "express";
import { StateServices } from "./state.service.js";
import { State } from "./state.model.js";

const createState = async (req: Request, res: Response) => {
  try {
    let result;
    if (Array.isArray(req.body)) {
      result = await State.insertMany(req.body);
    } else {
      result = await State.create(req.body);
    }

    res.status(201).json({
      success: true,
      message: "State(s) created successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};

const getAllStates = async (_req: Request, res: Response) => {
  try {
    const result = await StateServices.getAllStatesFromDB();
    res.status(200).json(result); // Direct array return korle apnar frontend-er fetching er shathe match korbe
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};

const deleteState = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await StateServices.deleteStateFromDB(id as string);
    res.status(200).json({
      success: true,
      message: "State deleted successfully",
      data: null,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};

export const StateControllers = {
  createState,
  getAllStates,
  deleteState,
};
