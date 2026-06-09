const router = require("express").Router()

const{
    register,
    login,
    refresh
} = require("../controllers/authController")

const {protect} = require("../middleware/authMiddleware")
const {authorizeRoles } = require("../middleware/roleMiddleware") 

router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);

router.get("/profile", protect, (req, res) => {
    res.json(req.user)
})

router.get("/admin", protect, authorizeRoles("admin"), (req,res) => {
    res.json({ message: "Admin acess"})
})

module.exports = router