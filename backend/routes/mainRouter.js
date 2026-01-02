const express = require("express");
const router = express.Router();

const authRouter = require("./auth");

router.get("/", (req, res) => {
    res.send("Server is running fantastically!!!");
});

router.post("/auth", authRouter);

module.exports = router;