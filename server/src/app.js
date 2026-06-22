require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const pool = require("./config/db");
const redis = require("./config/redis");

pool.query("SELECT 1").then(() => console.log("DB ready"));
redis.ping().then(() => console.log("Redis ready"));

const authRoutes = require("./routes/auth.routes");
const urlRoutes = require("./routes/url.routes");
const analyticsRoutes = require("./routes/analytics.routes");

app.use("/api/auth", authRoutes);
app.use("/api/urls", urlRoutes);
app.use("/api/analytics", analyticsRoutes);

// health check
app.get("/health", (req, res) => res.json({ status: "ok" }));

// error middleware — always last
app.use((err, req, res, next) => {
    console.error(err.message);
    res.status(err.status || 500).json({ message: err.message || "Server Error" });
});

module.exports = app;