const db = require("../../db/client");

const createSession = async (
  id,
  userId,
  refreshTokenHash,
  device,
  ip,
  expiresAt
) => {
  await db.execute({
    sql: `
      INSERT INTO sessions
      (
        id,
        user_id,
        refresh_token_hash,
        device_name,
        ip_address,
        expires_at
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    args: [
      id,
      userId,
      refreshTokenHash,
      device,
      ip,
      expiresAt
    ]
  });
};

module.exports = {
  createSession
};