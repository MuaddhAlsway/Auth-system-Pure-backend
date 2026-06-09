const jwt = require("jsonwebtoken");

exports.protect = (req, res, next) => {
    const header = req.headers.authorization;

    if(!header || !header.startsWith("Bearer")) {
        return res.status(401).json ({message: "Not authorized"})
    }

    const token = header.split(" ")[1];

    try{
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        req.user = decoded; // attach user data to request
        next()
    } catch (err){
        return res.status(401).json({ message: "Token invalid"})
    }

}


exports.authorizRoles = (...roles) =>{
    return (req,res,next) => {
        if(!roles.includes(req.user.role)){
            return res.sendStatus(403);
        }
        next();
    }
}