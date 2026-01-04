const express = require("express");
const router = express.Router();

const authRouter = require("@routes/auth");
const videoRouter = require("@routes/video");

router.get("/test", (req, res) => {
    res.send("Server is running fantastically!!!");
});

router.use("/auth", authRouter);
router.use("/video", videoRouter);

module.exports = router;