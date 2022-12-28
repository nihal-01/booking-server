const Joi = require("joi");

const attractionReviewSchema = Joi.object({
    title: Joi.string().required(),
    description: Joi.string().required(),
    rating: Joi.number().required(),
    attraction: Joi.string().required(),
});

module.exports = { attractionReviewSchema };
