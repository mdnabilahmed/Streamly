const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const UserModel = require("../models/User");

const { signAccessToken, signRefreshToken, verifyRefreshToken, verifyAccessToken } = require("../utils/jwt");
const bcrypt_hash = process.env.BCRYPT_HASH;

const signup = async (req, res) => {
    try {
        const { email, password, role } = req.body;

        if(!email || !password || !role){
            return res.status(400).json({
                message: "Bad request",
                success: false,
            });
        }

        if(!["admin", "editor", "viewer"].includes(role)){
            return res.status(400).json({
                message: "Invalid role",
                success: false,
            });
        }

        const checkUser = await UserModel.findOne({ email });
        if (checkUser) {
            return res.status(409).json({
                message: "User already exists, you can login",
                success: false,
            });
        }

        const hashedPassword = await bcrypt.hash(password, 14);

        const user = new UserModel({ email, password: hashedPassword, role, refreshTokens: [] });
        user.joined = Date.now();

        const accessToken = signAccessToken({ id: user._id });
        const refreshToken = signRefreshToken({ id: user._id });

        user.refreshTokens.push({ token: refreshToken });
        const savedUserData = await user.save();

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: (process.env.NODE_ENV === "production"),
            sameSite: "strict",
            path: "/auth/refresh"
        });

        res.status(201).json({
            message: "Signed up successfully",
            success: true,
            accessToken,
            userId: savedUserData._id,
            role: savedUserData.role,
        });
    } catch (err) {
        res.status(500).json({
            message: "Internal server errror",
            success: false,
        });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if(!email || !password){
            return res.status(400).json({
                message: "Bad request",
                success: false,
            });
        }

        const user = await UserModel.findOne({ email });

        if (!user) {
            return res
                .status(403)
                .json({ message: "Invalid Email or Password", success: false });
        }

        const isPassEqual = await bcrypt.compare(password, user.password);

        if (!isPassEqual) {
            return res
                .status(403)
                .json({ message: "Wrong Password", success: false });
        }

        const accessToken = signAccessToken({ id: user._id });
        const refreshToken = signRefreshToken({ id: user._id });

        user.refreshTokens.push({ token: refreshToken });
        const savedUserData = await user.save();

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: (process.env.NODE_ENV === "production"),
            sameSite: "strict",
            path: "/auth/refresh"
        });

        res.status(200).json({
            message: "Logged in successfully",
            success: true,
            accessToken,
            userId: savedUserData._id,
            role: savedUserData.role,
        });
    } catch (err) {
        console.log("Error while Login: ", err);
        res.status(500).json({
            message: "Internal Server error",
            success: false,
        });
    }
};

/* REFRESH TOKEN */
const refresh = async (req, res) => {
    const token = req.cookies.refreshToken;
    if (!token) return res.sendStatus(401);

    let payload;
    try {
        payload = verifyRefreshToken(token);
    } catch {
        return res.sendStatus(403);
    }

    const user = await User.findById(payload.id);
    if (!user) return res.sendStatus(403);

    const tokenExists = user.refreshTokens.find(
        (t) => t.token === token
    );

    if (!tokenExists) {
        user.refreshTokens = [];
        await user.save();
        return res.sendStatus(403);
    }

    // Rotate refresh token
    user.refreshTokens = user.refreshTokens.filter(
        (t) => t.token !== token
    );

    const newRefreshToken = signRefreshToken({ id: user._id });
    const newAccessToken = signAccessToken({ id: user._id });

    user.refreshTokens.push({ token: newRefreshToken });
    await user.save();

    res.cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        path: "/auth/refresh"
    });

    res.json({ accessToken: newAccessToken });
}

module.exports = {
    signup,
    login,
    refresh,
};