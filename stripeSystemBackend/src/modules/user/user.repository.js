const db = require("../../db/client");

const findByEmail = async (email) => {
    const result = await db.execute({
        sql: "SELECT * FROM users WHERE email = ?",
        args: [email]

    })

    return result.rows[0];
}


const createUser = async (id, email, password) => {
    await db.execute({
        sql: "INSERT INTO users (id, email, password) VALUES (?, ?, ?)",
        args: [id, email, password]
    })

    return { id, email };
}

module.exports = {
    findByEmail,
  createUser
}