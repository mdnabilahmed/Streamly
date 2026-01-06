const express = require("express");
const router = express.Router();

const { signup, login, refresh } = require("@controllers/auth");
const { signupValidation, loginValidation } = require("@middlewares/authValidation");

router.post("/signup", signupValidation, signup);
router.post("/login", loginValidation, login);
router.post("/refresh", refresh);

module.exports = router;