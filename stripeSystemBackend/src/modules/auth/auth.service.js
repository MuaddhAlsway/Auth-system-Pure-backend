const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');

const userRepo = require('../user/user.repository');
const authRepo = require('./auth.repository');
const { generateAccessToken, generateRefreshToken } = require('../../utils/jwt');

const register = async (email, password) => {
  const existing = await userRepo.findByEmail(email);
  if (existing) throw new Error("User already exists");

  const hashed = await bcrypt.hash(password, 10);

  const userId = uuidv4();

  const user = await userRepo.createUser(userId, email, hashed);

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  await authRepo.saveRefreshToken(
    uuidv4(),
    userId,
    refreshToken,
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  );

  return { user, accessToken, refreshToken };
};

const login = async (email, password) => {
  const user = await userRepo.findByEmail(email);
  if (!user) throw new Error("Invalid credentials");

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new Error("Invalid credentials");

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  await authRepo.saveRefreshToken(
    uuidv4(),
    user.id,
    refreshToken,
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  );

  return { user, accessToken, refreshToken };
};

module.exports = { register, login };