const jwt = require("jsonwebtoken");

exports.signAccessToken = (payload) =>
    jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
        expiresIn: process.env.ACCESS_TOKEN_EXP
    });

exports.signRefreshToken = (payload) =>
    jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
        expiresIn: process.env.REFRESH_TOKEN_EXP
    });

exports.verifyAccessToken = (token) =>
    jwt.verify(token, process.env.JWT_ACCESS_SECRET);

exports.verifyRefreshToken = (token) =>
    jwt.verify(token, process.env.JWT_REFRESH_SECRET);
