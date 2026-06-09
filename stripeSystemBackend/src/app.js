const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const helmet = require("helmet");

const authRoutes = require("./modules/auth/auth.routes");
const { errorHandler } = require("./middleware/error.middleware");

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:3000", credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);

app.use(errorHandler);

module.exports = app;
