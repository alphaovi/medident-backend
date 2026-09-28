import express from "express";
import { StudentControllers } from "./student.controller.js";

const router = express.Router();

router.post("/create-student", StudentControllers.createStudent);
// get all students
router.get("/", StudentControllers.getAllStudents);

// get single student
router.get("/:studentId", StudentControllers.getSingleStudent);

export const studentRoutes = router;
