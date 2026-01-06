const jwt = require("jsonwebtoken");

const JwtValidation = (req, res, next) => {
    const authHeader = req.header("Authorization");
    if (!authHeader) {
        return res
            .status(401)
            .json({ message: "No token, authorization denied", success: false });
    }

    // Extract the token by removing the "Bearer " prefix
    const token = authHeader.split(" ")[1];

    // console.log(token);

    if (!token) {
        return res
            .status(401)
            .json({ message: "Token missing from header", success: false });
    }
    // console.log("Token", token);

    try {
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        req.userId = decoded.id; // token payload includes an `_id` field for the user ID
        next();
    } catch (error) {
        console.log("Error while JWT Validation: ", error);
        res.status(401).json({ message: "Token is not valid", success: false });
    }
};

module.exports = JwtValidation;