import express from "express";
import bcrypt from "bcrypt";

import db from "../db";

export async function register(req: express.Request, res: express.Response) {
  try {
    const { email, password, username } = req.body;

    if (!email || !password || !username) {
      return res.sendStatus(400);
    }

    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (!!existingUser) {
      return res.sendStatus(409);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        username,
      },
    });
    return res.status(200).json(newUser);
  } catch (err) {
    console.log(err);
    return res.sendStatus(400);
  }
}

export async function login(req: express.Request, res: express.Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.sendStatus(400);
    }

    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (!existingUser) {
      return res.sendStatus(401);
    }

    const isValidPassword = await bcrypt.compare(
      password,
      existingUser.password
    );

    if (!isValidPassword) {
      return res.sendStatus(401);
    }

    // Create a hashed session token.
    const sessionToken = await bcrypt.hash(existingUser.id, 10);

    const updatedUser = await db.user.update({
      where: { id: existingUser.id },
      data: { sessionToken },
      select: {
        id: true,
        email: true,
        username: true,
        sessionToken: true,
      },
    });

    res.cookie("EXPRESS-API-AUTH", updatedUser.sessionToken, {
      domain: "localhost",
      path: "/",
    });

    return res.status(200).json(updatedUser);
  } catch (err) {
    console.log(err);
    return res.sendStatus(400);
  }
}
