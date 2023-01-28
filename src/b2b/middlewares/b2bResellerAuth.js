const jwt = require("jsonwebtoken");
const { sendErrorResponse } = require("../../helpers");

const Reseller = require("../models/reseller.model");

const b2bResellerAuth = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            return sendErrorResponse(res, 401, "token not found");
        }

        const decode = jwt.verify(token, process.env.JWT_SECRET);
        const reseller = await Reseller.findOne({
            _id: decode._id,
            jwtToken: token,
        });

        if (!reseller) {
            return sendErrorResponse(res, 401, "invalid token");
        }

        if (reseller.role !== "reseller") {
            return sendErrorResponse(
                res,
                400,
                "access denied. you should login as a reseller"
            );
        }

        req.reseller = reseller;
        next();
    } catch (err) {
        sendErrorResponse(res, 401, err);
    }
};

module.exports = b2bResellerAuth;
