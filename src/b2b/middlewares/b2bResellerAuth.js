const jwt = require("jsonwebtoken");
const { sendErrorResponse } = require("../../helpers");

const Reseller = require("../models/reseller.model");

const b2bResellerAuth = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (token) {
            const decode = jwt.verify(token, process.env.JWT_SECRET);
            const reseller = await Reseller.findOne({
                _id: decode._id,
                jwtToken: token,
            });

            console.log(reseller , "reseller")

            if (!reseller) {
                return sendErrorResponse(res, 401, "Invalid Token");
            }

            if (reseller.role !== "reseller") {
                return sendErrorResponse(
                    res,
                    400,
                    "Access denied. You should login as a reseller"
                );
            }

            req.reseller = reseller;
            next();
        } else {
            return sendErrorResponse(res, 401, "Notoken Token");
        }
    } catch (err) {
        sendErrorResponse(res, 401, err);
    }
};

module.exports = b2bResellerAuth;
