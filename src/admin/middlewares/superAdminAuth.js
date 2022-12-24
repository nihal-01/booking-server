const jwt = require("jsonwebtoken");

const { Admin } = require("../models");
const { sendErrorResponse } = require("../../helpers");

const superAdminAuth = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        const decode = jwt.verify(token, process.env.JWT_SECRET);
        const admin = await Admin.findOne({
            _id: decode._id,
            jwtToken: token,
        });

        if (!admin) {
            return sendErrorResponse(res, 401, "Invalid Token");
        }

        if (admin.role !== "super-admin") {
            return sendErrorResponse(res, 401, "API Access denied!");
        }

        req.admin = admin;
        next();
    } catch (err) {
        sendErrorResponse(res, 401, err);
    }
};

module.exports = superAdminAuth;
