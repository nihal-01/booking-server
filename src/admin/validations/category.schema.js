const Joi = require("joi");

const blogCategorySchema = Joi.object({
    categoryName: Joi.string().required(),
    description: Joi.string().allow("", null),
});

const attractionCategorySchema = Joi.object({
    categoryName: Joi.string().required(),
    description: Joi.string().allow("", null),
});

module.exports = { blogCategorySchema, attractionCategorySchema };
