const jwt = require("jsonwebtoken")

exports.generateAccessToken = (user) => {
    return jwt.sign(
        {
            id: user.id, role: user.role
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: "15m"
        }
    )
}

exports.generateRefreshToken = (user) => {
    return jwt.sign(
        {id: user.id, role: user.role},
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: "7d" 
        }
    )
}