const Joi = require("joi");

const apiSchema = Joi.object({
    apiCode: Joi.string().required(),
    apiName: Joi.string().required(),
    demoUrl: Joi.string().required(),
    demoAgentId: Joi.string().allow("", null),
    demoUsername: Joi.string().required(),
    demoPassword: Joi.string().required(),
    liveUrl: Joi.string().required(),
    liveAgentId: Joi.string().allow("", null),
    liveUsername: Joi.string().required(),
    livePassword: Joi.string().required(),
    runningMode: Joi.string().required().valid("demo", "live"),
    type: Joi.string()
        .required()
        .valid("attraction", "visa", "hotel", "flight"),
    isActive: Joi.boolean().required(),
});

module.exports = { apiSchema };
