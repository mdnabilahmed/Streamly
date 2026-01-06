const UserModel = require("../models/User");

const checkRole = (roles) => {
    return async (req, res, next) => {
        try {
            // req.userId is expected to be set by the preceding jwtValidation middleware
            if (!req.userId) {
                return res.status(401).json({ message: "Unauthorized: User ID missing", success: false });
            }
            
            const user = await UserModel.findById(req.userId);
            if (!user) {
                return res.status(401).json({ message: "User not found", success: false });
            }

            if (!roles.includes(user.role)) {
                return res.status(403).json({ message: "Access denied: Insufficient permissions", success: false });
            }
            
            req.user = user;
            next();
        } catch (error) {
            console.error("Error in checkRole middleware:", error);
            return res.status(500).json({ message: "Internal server error", success: false });
        }
    };
};

module.exports = checkRole;
