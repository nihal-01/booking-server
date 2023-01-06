const Joi = require("joi");

const couponSchema = Joi.object({
    couponCode: Joi.string().required(),
    amountType: Joi.string().allow(["percentage", "flat"]),
    amount: Joi.number().required(),
    // validFrom: Joi.,
    validTill,
    isActive,
    totalUses,
    isMaximumLimit,
    maximumLimit,
    couponFor,
});
