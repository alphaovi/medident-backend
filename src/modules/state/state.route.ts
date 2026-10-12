import { Router } from "express";
import { StateValidation } from "./state.validator.js";
import { StateControllers } from "./state.controller.js";
import validateRequest from "../../middlewares/validateRequest.js";

const router = Router();

router.post(
  "/create-state",
  validateRequest(StateValidation.createStateValidationSchema),
  StateControllers.createState
);

router.get("/", StateControllers.getAllStates);


router.patch("/:id", StateControllers.updateState);


router.delete("/:id", StateControllers.deleteState);

export const StateRoutes = router;