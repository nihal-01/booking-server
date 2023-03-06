const singleFlightDetailsSchema = Joi.object({
    noOfAdults: Joi.number().required().min(1),
    noOfChildren: Joi.number().required(),
    noOfInfants: Joi.number().required(),
    type: Joi.string().required().valid("oneway", "return", "multicity"),
    trips: Joi.array()
        .items({
            flightSegments: Joi.array()
                .items({
                    from: Joi.string().required(),
                    to: Joi.string().required(),
                    arrivalDate: Joi.date().required(),
                    departureDate: Joi.date().required(),
                    flightNumber: Joi.string().required(),
                    rph: Joi.string().required(),
                })
                .min(1),
        })
        .min(1),
    bundledServiceId: Joi.string().allow("", null),
});

module.export = {singleFlightDetailsSchema}