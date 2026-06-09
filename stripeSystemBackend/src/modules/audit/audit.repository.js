const db = require("../../db/client");

const log = async (
  id,
  userId,
  action,
  metadata
) => {
  await db.execute({
    sql: `
      INSERT INTO audit_logs
      (
        id,
        user_id,
        action,
        metadata
      )
      VALUES (?, ?, ?, ?)
    `,
    args: [
      id,
      userId,
      action,
      JSON.stringify(metadata)
    ]
  });
};

module.exports = { log };