const { createClient } = require("@libsql/client/http");

let db;

function getClient() {
  if (!db) {
    if (!process.env.TURSO_DATABASE_URL) {
      throw new Error("TURSO_DATABASE_URL is not set.");
    }
    db = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }
  return db;
}

module.exports = new Proxy({}, {
  get(_, prop) {
    return getClient()[prop];
  }
});
