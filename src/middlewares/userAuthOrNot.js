const jwt = require("jsonwebtoken");

const { User } = require("../models");
const { sendErrorResponse } = require("../helpers");

const userAuthOrNot = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (token) {
            const decode = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findOne({
                _id: decode._id,
                jwtToken: token,
            });

            if (user) {
                req.user = user;
            }
        }

        next();
    } catch (err) {
        sendErrorResponse(res, 401, err);
    }
};

module.exports = userAuthOrNot;
