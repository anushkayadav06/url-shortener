const express = require("express");
const router = express.Router();
const { createShortUrl, getUserUrls, deleteUrl, redirectUrl } = require("../controllers/url.controller");
const { protect } = require("../middleware/auth.middleware");

router.post("/shorten", protect, createShortUrl);
router.get("/my-urls", protect, getUserUrls);
router.delete("/:shortCode", protect, deleteUrl);

// redirect is public — no auth needed
router.get("/:shortCode", redirectUrl);

module.exports = router;