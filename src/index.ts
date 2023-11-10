import http from "http";
import express from "express";

import cors from "cors";
import bodyParser from "body-parser";
import compression from "compression";
import cookieParser from "cookie-parser";

import router from "./router";

const app = express();

app.use(cors({ credentials: true }));
app.use(compression());
app.use(bodyParser.json());
app.use(cookieParser());

const server = http.createServer(app);

app.use("/", router());

server.listen(3000, () => {
  console.log("Server is running on port 3000");
});
