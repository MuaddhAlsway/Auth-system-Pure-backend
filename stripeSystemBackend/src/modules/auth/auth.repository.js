const db = require('../../db/client');

const saveRefreshToken = async (id, userId, token, expiresAt) => {
  await db.execute({
    sql: `
      INSERT INTO refresh_tokens (id, user_id, token, expires_at)
      VALUES (?, ?, ?, ?)
    `,
    args: [id, userId, token, expiresAt]
  });
};

const findRefreshToken = async (token) => {
  const result = await db.execute({
    sql: "SELECT * FROM refresh_tokens WHERE token = ?",
    args: [token]
  });

  return result.rows[0];
};

const deleteRefreshToken = async (token) => {
  await db.execute({
    sql: "DELETE FROM refresh_tokens WHERE token = ?",
    args: [token]
  });
};

module.exports = {
  saveRefreshToken,
  findRefreshToken,
  deleteRefreshToken
};