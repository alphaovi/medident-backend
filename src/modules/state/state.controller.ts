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
    res.status(200).json(result); 
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};

// নতুন আপডেট কন্ট্রোলার
const updateState = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updatedData = req.body;

    const result = await StateServices.updateStateInDB(id, updatedData);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "State not found for update",
      });
    }

    res.status(200).json({
      success: true,
      message: "State updated successfully",
      data: result,
    });
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
  updateState, // এক্সপোর্ট করা হলো
  deleteState,
};