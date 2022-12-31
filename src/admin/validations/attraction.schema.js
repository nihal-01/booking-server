const Joi = require("joi");

const attractionSchema = Joi.object({
    title: Joi.string().required(),
    category: Joi.string().required(),
    bookingType: Joi.string()
        .allow(...["booking", "ticket"])
        .required(),
    destination: Joi.string().required(),
    isActive: Joi.boolean(),
    startDate: Joi.date().when("availability", {
        is: Joi.string().valid("monthly", "yearly", "custom"),
        then: Joi.date().required(),
    }),
    endDate: Joi.date().when("availability", {
        is: Joi.string().valid("monthly", "yearly", "custom"),
        then: Joi.date().required(),
    }),
    offDays: Joi.array().items(
        Joi.string().valid(
            "sunday",
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
            "saturday"
        )
    ),
    offDates: Joi.array().valid(Joi.date()),
    durationType: Joi.string().valid("hours", "days", "months").required(),
    duration: Joi.number().required(),
    latitude: Joi.string().allow("", null),
    longitude: Joi.string().allow("", null),
    isOffer: Joi.boolean().required(),
    offerAmountType: Joi.string().when("isOffer", {
        is: Joi.boolean().valid(true),
        then: Joi.string()
            .valid(...["flat", "percentage"])
            .required(),
    }),
    offerAmount: Joi.number()
        .allow("")
        .when("isOffer", {
            is: Joi.boolean().valid(true),
            then: Joi.number().required(),
        }),
    youtubeLink: Joi.string().required(),
    pickupAndDrop: Joi.string().valid(...["yes", "no"]),
    highlights: Joi.string().required(),
    sections: Joi.array().items({
        title: Joi.string().required(),
        body: Joi.string().required(),
    }),
});

const attractionActivitySchema = Joi.object({
    attraction: Joi.string().required(),
    name: Joi.string().required(),
    facilities: Joi.string().required(),
    adultAgeLimit: Joi.number().required(),
    adultPrice: Joi.number().required(),
    childAgeLimit: Joi.number().required(),
    childPrice: Joi.number().required(),
    infantAgeLimit: Joi.number().required(),
    infantPrice: Joi.number().allow(""),
    isVat: Joi.boolean().required(),
    vat: Joi.number().when("isVat", {
        is: Joi.boolean().valid(true),
        then: Joi.number().required(),
    }),
    base: Joi.string()
        .valid(...["person", "private", "hourly"])
        .required(),
    isTransferAvailable: Joi.boolean().required(),
    privateTransferPrice: Joi.number(),
    sharedTransferPrice: Joi.number(),
    isActive: Joi.boolean(),
    peakTime: Joi.date().allow("", null),
    note: Joi.string().allow("", null),
});

const attractionTicketUploadSchema = Joi.object({
    activity: Joi.string().required(),
});

module.exports = {
    attractionSchema,
    attractionActivitySchema,
    attractionTicketUploadSchema,
};
