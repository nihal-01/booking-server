const Joi = require("joi");

const resellerStatusUpdateSchema = Joi.object({
    status: Joi.string().allow("cancelled", "ok", "disabled"),
});

module.exports = { resellerStatusUpdateSchema };
