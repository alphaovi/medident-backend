import express from "express";
import { UserControllers } from "./user.controller.js";
import { verifyJWT } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/register", UserControllers.registerUser);
router.post("/create-user", UserControllers.registerUser);
router.get("/verify-account", UserControllers.verifyAccount);
router.post("/recover-account", UserControllers.recoverAccount);
router.post("/login", UserControllers.loginUser);
router.get("/me", verifyJWT, UserControllers.getMe);
router.get("/", verifyJWT, UserControllers.getAllUsers);

export const UserRoutes = router;