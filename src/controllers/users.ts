import express from "express";
import db from "../db";

export async function getAllUsers(req: express.Request, res: express.Response) {
  try {
    const users = await db.user.findMany();
    return res.status(200).json(users);
  } catch (err) {
    console.log(err);
    return res.sendStatus(400);
  }
}

export async function deleteUser(req: express.Request, res: express.Response) {
  try {
    /**
     * We can access the id of the user we want
     * to delete from the request parameters.
     */
    const { id } = req.params;

    const deleteduser = await db.user.delete({ where: { id } });
    return res.status(200).json(deleteduser);
  } catch (err) {
    console.log(err);
    return res.sendStatus(400);
  }
}

export async function updateUser(req: express.Request, res: express.Response) {
  try {
    const { id } = req.params;
    const { username } = req.body;

    if (!username) {
      return res.sendStatus(400);
    }

    const existinguser = await db.user.findUnique({
      where: { id },
    });

    if (!existinguser) {
      return res.sendStatus(400);
    }

    const updateduser = await db.user.update({
      where: { id },
      data: { username },
    });

    return res.status(200).json(updateduser);
  } catch (err) {
    console.log(err);
    return res.sendStatus(400);
  }
}
