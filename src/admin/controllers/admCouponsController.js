const { sendErrorResponse } = require("../../helpers");
const { Coupon } = require("../../models");

module.exports = {
    createCoupon: async (req, res) => {
        try {
            const {
                couponCode,
                amountType,
                amount,
                validFrom,
                validTill,
                isActive,
                totalUses,
                isMaximumLimit,
                maximumLimit,
                couponFor,
            } = req.body;

            const newCoupon = await Coupon.findOne({});

            res.status(200).json(newCoupon);
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },
};
