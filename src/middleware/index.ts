import express from "express";
import { get, merge } from "lodash";

import db from "../db";

export async function isAuthenticated(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  try {
    /**
     * NOTE: This cookie name must be the same
     * as the one we set in login controller.
     */
    const sessionToken = req.cookies["EXPRESS-API-AUTH"];

    if (!sessionToken) {
      return res.sendStatus(403);
    }

    const existingUser = await db.user.findFirst({
      where: { sessionToken },
    });

    if (!existingUser) {
      return res.sendStatus(403);
    }

    merge(req, { identity: existingUser });

    return next();
  } catch (err) {
    console.log(err);
    return res.sendStatus(400);
  }
}

export async function isOwnAccount(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  try {
    const { id } = req.params;

    const identity = get(req, "identity.id");
    const currentUserId =
      identity !== undefined ? (identity as string) : undefined;

    if (!currentUserId) {
      return res.sendStatus(403);
    }

    if (currentUserId.toString() !== id) {
      return res.sendStatus(403);
    }

    return next();
  } catch (err) {
    console.log(err);
    return res.sendStatus(400);
  }
}
