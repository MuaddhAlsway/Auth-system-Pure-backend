const authService = require('./auth.service');

const register = async (req, res, next) => {
  try {
    const { accessToken, refreshToken, user } = await authService.register(req.body.email, req.body.password);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.status(201).json({ accessToken, user });

  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { accessToken, refreshToken, user } = await authService.login(req.body.email, req.body.password);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.json({ accessToken, user });

  } catch (err) {
    next(err);
  }
};

module.exports = { register, login };
