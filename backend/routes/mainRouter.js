const express = require("express");
const router = express.Router();

const authRouter = require("@routes/auth");
const videoRouter = require("@routes/video");
const jwtValidation = require("@middlewares/jwtValidation");

router.get("/test", (req, res) => {
    res.send("Server is running fantastically!!!");
});

router.use("/auth", authRouter);
router.use("/video", jwtValidation, videoRouter);

module.exports = router;