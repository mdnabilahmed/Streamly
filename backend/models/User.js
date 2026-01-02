const mongoose = require("mongoose");

const refreshTokenSchema = new mongoose.Schema({
    token: String,
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 30 * 24 * 60 * 60 // 30 days expiry
    }
});

const userSchema = new mongoose.Schema({
    email: { type: String, unique: true },
    password: String,
    joined: { type: Date, default: Date.now },
    role: { type: String, enum: ["admin", "editor", "viewer"], default: "viewer" },
    refreshTokens: [refreshTokenSchema]
});

module.exports = mongoose.model("userdata", userSchema);;