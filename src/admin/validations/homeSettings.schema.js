const Joi = require("joi");

const homeMetaSettingsSchema = Joi.object({
    mobileNumber1: Joi.string().required(),
    mobileNumber2: Joi.string(),
    email: Joi.string().email().required(),
    facebookUrl: Joi.string(),
    instagramUrl: Joi.string(),
    footerDescription: Joi.string(),
});

const homeFooterSettingsSchema = Joi.object({
    title: Joi.string().required(),
    navLinks: Joi.array().items({
        name: Joi.string().required(),
        link: Joi.string().required(),
        isRelativeUrl: Joi.boolean(),
    }),
});

const homeSectionsSettingsSchema = Joi.object({
    isBestSellingAttractionsSectionEnabled: Joi.boolean().required(),
    bestSellingAttractions: Joi.array().when(
        "isBestSellingAttractionsSectionEnabled",
        {
            is: Joi.boolean().valid(true),
            then: Joi.array().min(1).required(),
        }
    ),
    isTopAttractionsSectionEnabled: Joi.boolean().required(),
    topAttractions: Joi.array().when("isTopAttractionsSectionEnabled", {
        is: Joi.boolean().valid(true),
        then: Joi.array().min(1).required(),
    }),
    isBlogsEnabled: Joi.boolean().required(),
});

const homeHeroSettingsSchema = Joi.object({
    heroTitle: Joi.string().required(),
    heroDescription: Joi.string().required(),
});

const homeCardSettingsSchema = Joi.object({
    title: Joi.string().required(),
    description: Joi.string().required(),
    tag: Joi.string(),
});

module.exports = {
    homeMetaSettingsSchema,
    homeFooterSettingsSchema,
    homeHeroSettingsSchema,
    homeCardSettingsSchema,
    homeSectionsSettingsSchema,
};
