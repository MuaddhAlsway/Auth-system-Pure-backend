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
      sql: "INSERT INTO users (id, username, email, password, role) VALUES (?, ?, ?, ?, ?)",
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
    console.error("[register]", err.message);
    res.status(500).json({ message: "Server error", detail: err.message });
  }
};

// LOGIN
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await db.execute({
      sql: "SELECT * FROM users WHERE email = ?",
      args: [email],
    });

    const user = result.rows[0];

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const payload = { id: user.id, username: user.username, email: user.email, role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await db.execute({
      sql: "UPDATE users SET refresh_token = ? WHERE id = ?",
      args: [refreshToken, user.id],
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
    });

    res.json({ accessToken });

  } catch (err) {
    console.error("[login]", err.message);
    res.status(500).json({ message: "Server error", detail: err.message });
  }
};

// REFRESH TOKEN
exports.refresh = async (req, res) => {
  const token = req.cookies?.refreshToken;

  if (!token) {
    return res.status(401).json({ message: "No refresh token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);

    const result = await db.execute({
      sql: "SELECT * FROM users WHERE id = ? AND refresh_token = ?",
      args: [decoded.id, token],
    });

    const user = result.rows[0];
    if (!user) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    const payload = { id: user.id, username: user.username, email: user.email, role: user.role };
    const accessToken = generateAccessToken(payload);

    res.json({ accessToken });

  } catch (err) {
    console.error("[refresh]", err.message);
    return res.status(403).json({ message: "Refresh token expired or invalid" });
  }
};
