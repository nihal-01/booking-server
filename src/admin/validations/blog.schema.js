const Joi = require("joi");

const blogSchema = Joi.object({
    title: Joi.string().required(),
    body: Joi.string().required(),
    category: Joi.string().required(),
    tags: Joi.string(),
    thumbnail: Joi.string().allow("", null),
});

module.exports = { blogSchema };
