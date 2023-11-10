import express from "express";

import { isAuthenticated, isOwnAccount } from "../middleware";
import { deleteUser, getAllUsers, updateUser } from "../controllers/users";

export default function (router: express.Router) {
  router.get("/users", isAuthenticated, getAllUsers);
  router.delete("/users/:id", isAuthenticated, isOwnAccount, deleteUser);
  router.patch("/users/:id", isAuthenticated, isOwnAccount, updateUser);
}
