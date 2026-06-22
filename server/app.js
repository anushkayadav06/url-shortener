require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors({ origin: "*", credentials: true }));
app.use(express.json());

const pool = require("./src/config/db");
const redis = require("./src/config/redis");

pool.query("SELECT 1").then(() => console.log("DB ready"));
redis.ping().then(() => console.log("Redis ready"));

const authRoutes = require("./src/routes/auth.routes");
const urlRoutes = require("./src/routes/url.routes");
const analyticsRoutes = require("./src/routes/analytics.routes");

app.use("/api/auth", authRoutes);
app.use("/api/urls", urlRoutes);
app.use("/api/analytics", analyticsRoutes);

// health check
app.get("/health", (req, res) => res.json({ status: "ok" }));

// redirect route — must be after all other routes
const { redirectUrl } = require("./src/controllers/url.controller");
app.get("/:shortCode", redirectUrl);

// error middleware — always last
app.use((err, req, res, next) => {
    console.error(err.message);
    res.status(err.status || 500).json({ message: err.message || "Server Error" });
});

module.exports = app;