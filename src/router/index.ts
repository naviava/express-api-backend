import express from "express";
import auth from "./auth";
import users from "./users";

const router = express.Router();

export default function () {
  auth(router);
  users(router);

  return router;
}
