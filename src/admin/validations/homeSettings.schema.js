const Joi = require("joi");

const homeMetaSettingsSchema = Joi.object({
    phoneNumber1: Joi.string().allow("", null),
    phoneNumber2: Joi.string().allow("", null),
    email: Joi.string().email().allow("", null),
    facebookUrl: Joi.string().allow("", null),
    instagramUrl: Joi.string().allow("", null),
    footerDescription: Joi.string().allow("", null),
});

const homeFooterSettingsSchema = Joi.object({
    footer: Joi.array().items({
        title: Joi.string().required(),
        navLinks: Joi.array().items({
            name: Joi.string().required(),
            link: Joi.string().required(),
            isRelativeUrl: Joi.boolean().required(),
        }),
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
    title: Joi.string().required(),
    description: Joi.string().required(),
    place: Joi.string().required(),
    image: Joi.string().allow("", null),
});

const homeCardSettingsSchema = Joi.object({
    title: Joi.string().required(),
    description: Joi.string().required(),
    tag: Joi.string().allow("", null),
    url: Joi.string().required(),
    isRelativeUrl: Joi.boolean().required(),
    icon: Joi.any(),
    backgroundImage: Joi.any(),
});

module.exports = {
    homeMetaSettingsSchema,
    homeFooterSettingsSchema,
    homeHeroSettingsSchema,
    homeCardSettingsSchema,
    homeSectionsSettingsSchema,
};
