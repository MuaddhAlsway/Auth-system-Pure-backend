const express = require("express");
const authController = require("./auth.controller");
const authMiddleware = require("../../middleware/auth.middleware");

const router = express.Router();

router.post("/register", authController.register);
router.post("/login", authController.login);

// Protected — returns current user from token
router.get("/me", authMiddleware, (req, res) => {
  res.json(req.user);
});

module.exports = router;
