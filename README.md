# Creating an Express API Backend with Authentication

This repository provides a guide and codebase for creating an Express API backend with TypeScript, Prisma ORM, and PostgreSQL for authentication. The application includes user registration, login, and CRUD operations on user data.

## Table of Contents

1. [Getting Started](#1-getting-started)

   - [1.2 Create tsconfig.json](#12-create-tsconfigjson)
   - [1.3 Create nodemon.json](#13-create-nodemonjson)
   - [1.4 Create src/index.ts](#14-create-srcindexts)
   - [1.5 Update package.json](#15-update-packagejson)

2. [Setting up Prisma with PostgreSQL](#2-setting-up-prisma-with-postgresql)

   - [2.1 Install Prisma and Docker](#21-install-prisma-and-docker)
   - [2.2 Configure Docker with docker-compose.yml](#22-configure-docker-with-docker-composeyml)
   - [2.3 Run PostgreSQL docker container](#23-run-postgresql-docker-container)
   - [2.4 Configure Prisma](#24-configure-prisma)
   - [2.5 Define Prisma Schema](#25-define-prisma-schema)
   - [2.6 Run Prisma Migrations](#26-run-prisma-migrations)
   - [2.7 Additional Dependencies](#27-additional-dependencies)

3. [User Authentication](#3-user-authentication)

   - [3.1 Install bcrypt and Create Helpers](#31-install-bcrypt-and-create-helpers)
   - [3.2 Create Auth Controllers](#32-create-auth-controllers)
   - [3.3 Create Auth Routes](#33-create-auth-routes)
   - [3.4 Middleware for Authentication](#34-middleware-for-authentication)

4. [User Management](#4-user-management)
   - [4.1 Create Users Controller](#41-create-users-controller)
   - [4.2 Create Users Router](#42-create-users-router)
   - [4.3 Secure Routes with Middleware](#43-secure-routes-with-middleware)
   - [4.4 CRUD Operations](#44-crud-operations)
   - [4.5 Update User Information](#45-update-user-information)

## 1. Getting Started

### 1.2 Create tsconfig.json

```json
{
  "compilerOptions": {
    "sourceMap": true,
    "baseUrl": "src",
    "outDir": "dist",
    "strict": true,
    "noImplicitAny": true,
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["esnext"],
    "esModuleInterop": true
  },
  "include": ["src/**/*"]
}
```

### 1.3 Create nodemon.json

```json
{
  "watch": ["src"],
  "ext": "ts",
  "ignore": ["src/**/*.spec.ts"],
  "exec": "ts-node ./src/index.ts"
}
```

### 1.4 Create src/index.ts

```ts
import http from "http";
import express from "express";

import cors from "cors";
import bodyParser from "body-parser";
import compression from "compression";
import cookieParser from "cookie-parser";

const app = express();

app.use(cors({ credentials: true }));
app.use(compression());
app.use(bodyParser.json());
app.use(cookieParser());

const server = http.createServer(app);

server.listen(3000, () => {
  console.log("Server is running on port 3000");
});
```

### 1.5 Update package.json

```json
"scripts": {
    "start": "nodemon",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
```

## 2. Setting up Prisma with PostgreSQL

### 2.1 Install Prisma and Docker

```bash
npm i -D prisma
```

### 2.2 Configure Docker with docker-compose.yml

```yml
version: "3.8"
services:
  postgres:
    image: postgres:10.3
    restart: always
    environment:
      - POSTGRES_USER=sammy
      - POSTGRES_PASSWORD=your_password
    volumes:
      - postgres:/var/lib/postgresql/data
    ports:
      - "5432:5432"
volumes:
  postgres:
```

### 2.3 Run PostgreSQL docker container

```bash
docker-compose up -d
```

### 2.4 Configure Prisma

```bash
npx prisma init
```

### 2.5 Define Prisma Schema

prisma/schema.prisma

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id           String  @id @default(cuid())
  username     String
  email        String  @unique
  password     String
  salt         String?
  sessionToken String?
}
```

### 2.6 Run Prisma Migrations

```bash
npx prisma migrate dev --name init
```

### 2.7 Additional Dependencies

```bash
npm i @prisma/client
```

## 3. User Authentication

### 3.1 Install bcrypt and Create Helpers

```bash
npm i bcrypt
```

### 3.2 Create Auth Controllers

/controllers/auth.ts

```ts
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
```

### 3.3 Create a general router

/routes/index.ts

```ts
import express from "express";

const router = express.Router();

export default function () {
  return router;
}
```

### 3.4 Create Auth Routes

/routes/auth.ts

```ts
import express from "express";
import { register } from "../controllers/auth";

export default function (router: express.Router) {
  router.post("/auth/register", register);
}
```

### 3.5 Use the main router in index.ts

/src/index.ts

```ts
import router from "./router";
app.use("/", router()); // NOTE: router function is executed here.
```

### 3.6 Create login controller

/controllers/auth.ts

```ts
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
```

### 3.7 Add the login route

/routes/auth.ts

```ts
import { login } from "../controllers/auth";
router.post("/auth/login", login);
```

### 3.8 Create middleware for authentication

```bash
npm i lodash && npm i @types/lodash
```

/middleware/index.ts

```ts
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
```

### 3.9 Create a user controller

/controllers/users.ts

```ts
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
```

### 3.10 Create a user router

/routes/users.ts

```ts
import express from "express";
import { getAllUsers } from "../controllers/users";

export default function (router: express.Router) {
  router.get("/users", getAllUsers);
}
```

### 3.11 Add the user router to the main router

/router/users.ts

```ts
import users from "./users";
users(router);
```

### 3.12 Secure the user route with middleware

/routes/users.ts

```ts
import { isAuthenticated } from "../middleware";
import { getAllUsers } from "../controllers/users";

export default function (router: express.Router) {
  router.get("/users", isAuthenticated, getAllUsers);
}
```

## 4. CRUD Operations

### 4.1 Create delete user controller

/controllers/users.ts

```ts
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
```

### 4.2 Create delete user route

/routes/users.ts

```ts
router.delete("/users/:id", isAuthenticated, deleteUser);
```

### 4.3 Chaining middleware

What if we want only the account owner to be able to delete their account. We can achieve this by chaining middleware.

/middleware/index.ts

```ts
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
```

/routes/users.ts

```ts
// NOTE: isOwnAccount is executed second, after isAuthenticated.
router.delete("/users/:id", isAuthenticated, isOwnAccount, deleteUser);
```

### 4.4 Create update user controller

/controllers/users.ts

```ts
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
```

### 4.5 Create update user route

/routes/users.ts

```ts
router.patch("/users/:id", isAuthenticated, isOwnAccount, updateUser);
```
