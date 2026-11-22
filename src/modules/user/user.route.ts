import express from "express";
import { UserControllers } from "./user.controller.js";
import { verifyJWT } from "../../middlewares/auth.middleware.js";
import validateRequest from "../../middlewares/validateRequest.js";
import {
  approveUserValidationSchema,
  loginUserValidationSchema,
  recoverAccountValidationSchema,
  registerUserValidationSchema,
  updateUserActiveStatusValidationSchema,
} from "./user.validation.js";

const router = express.Router();

router.post(
  "/register",
  validateRequest(registerUserValidationSchema),
  UserControllers.registerUser
);
router.post(
  "/create-user",
  validateRequest(registerUserValidationSchema),
  UserControllers.registerUser
);
router.get("/verify-account", UserControllers.verifyAccount);
router.post(
  "/recover-account",
  validateRequest(recoverAccountValidationSchema),
  UserControllers.recoverAccount
);
router.post(
  "/login",
  validateRequest(loginUserValidationSchema),
  UserControllers.loginUser
);
router.get("/me", verifyJWT, UserControllers.getMe);
router.get("/", verifyJWT, UserControllers.getAllUsers);
router.patch(
  "/:id/approve",
  verifyJWT,
  validateRequest(approveUserValidationSchema),
  UserControllers.approveUser
);
router.patch(
  "/:id/status",
  verifyJWT,
  validateRequest(updateUserActiveStatusValidationSchema),
  UserControllers.updateUserActiveStatus
);

export const UserRoutes = router;