const db = require("../db/client");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { randomUUID } = require("crypto");
const { generateAccessToken, generateRefreshToken } = require("../utils/tokens");

// REGISTER
exports.register = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const exists = await db.execute({
      sql: "SELECT * FROM users WHERE email = ?",
      args: [email],
    });

    if (exists.rows.length > 0) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const id = randomUUID();

    const user = { id, username, email, role: "user" };

    await db.execute({
      sql: `
        INSERT INTO users (id, username, email, password, role)
        VALUES (?, ?, ?, ?, ?)
      `,
      args: [id, username, email, hashed, "user"],
    });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await db.execute({
      sql: "UPDATE users SET refresh_token = ? WHERE id = ?",
      args: [refreshToken, id],
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
    });

    res.json({ accessToken });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};