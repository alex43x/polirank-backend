import express from "express";
import userController from "../controllers/userController.js";

const userRoutes = express.Router();

userRoutes.get("/", userController.getAllUsers);
userRoutes.get("/:id", userController.getUserbyId);
userRoutes.post("/", userController.createUser);
userRoutes.put("/:id", userController.updateUser);
userRoutes.delete("/:id", userController.deleteUser);

export default userRoutes;