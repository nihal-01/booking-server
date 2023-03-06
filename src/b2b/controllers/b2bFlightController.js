const {
    availabilitySearchSchema,
} = require("../../validations/flightApi.schema");
const {
    flightAvailabilitySearch,
    getSingleTripDetails,
} = require("../helpers");
const { B2BSubAgentFlightMarkup, B2BClientFlightMarkup } = require("../models");

module.exports = {
    flightAvailability: async (req, res) => {
        try {
            const {
                from,
                to,
                departureDate,
                returnDate,
                noOfAdults,
                noOfChildren,
                noOfInfants,
                type,
                airItineraries,
            } = req.body;

            const { _, error } = availabilitySearchSchema.validate(req.body);
            if (error) {
                return sendErrorResponse(res, 400, error.details[0].message);
            }

            const flightResult = await flightAvailabilitySearch(req.body);

            let resellerToSubAgentMarkup;
            if (req.reseller.role == "sub-agent") {
                resellerToSubAgentMarkup =
                    await B2BSubAgentFlightMarkup.findOne({
                        resellerId: req.reseller.referredBy,
                    });
            }

            let resellerToClientMarkup = await B2BClientFlightMarkup.findOne({
                resellerId: req.reseller._id,
            });

            for (i = 0; i < flightResult.length; i++) {
                let markup = 0;
                flightResult[i].totalFare = parseFloat(
                    flightResult[i].totalFare
                );
                if (resellerToSubAgentMarkup) {
                    if (resellerToSubAgentMarkup.markupType === "flat") {
                        markup += resellerToSubAgentMarkup.markup;
                    } else {
                        markup +=
                            (resellerToSubAgentMarkup.markup *
                                flightResult[i].totalFare) /
                            100;
                    }
                }

                if (resellerToClientMarkup) {
                    if (resellerToClientMarkup.markupType === "flat") {
                        markup += resellerToClientMarkup.markup;
                    } else {
                        markup +=
                            (resellerToClientMarkup.markup *
                                flightResult[i].totalFare) /
                            100;
                    }
                }

                flightResult[i].totalFare += markup;
            }

            res.status(200).json({ flightResult });
        } catch (err) {
            console.log(err, "error");
        }
    },

    getSingleTripDetailsWithBundledFare: async (req, res) => {
        try {
            const {
                noOfAdults,
                noOfChildren,
                noOfInfants,
                trips,
                type,
                bundledServiceId,
            } = req.body;

            console.log("call reached");

            // const { _, error } = singleFlightDetailsSchema.validate(req.body);
            // if (error) {
            //     return sendErrorResponse(res, 400, error.details[0].message);
            // }

            console.log("call reached");

            let response = await getSingleTripDetails(req.body);

            let resellerToSubAgentMarkup;
            if (req.reseller.role == "sub-agent") {
                resellerToSubAgentMarkup =
                    await B2BSubAgentFlightMarkup.findOne({
                        resellerId: req.reseller.referredBy,
                    });
            }

            let resellerToClientMarkup = await B2BClientFlightMarkup.findOne({
                resellerId: req.reseller._id,
            });

            for (i = 0; i < flightResult.length; i++) {
                let markup = 0;
                flightResult[i].totalFare = parseFloat(
                    flightResult[i].totalFare
                );
                if (resellerToSubAgentMarkup) {
                    if (resellerToSubAgentMarkup.markupType === "flat") {
                        markup += resellerToSubAgentMarkup.markup;
                    } else {
                        markup +=
                            (resellerToSubAgentMarkup.markup *
                                flightResult[i].totalFare) /
                            100;
                    }
                }

                if (resellerToClientMarkup) {
                    if (resellerToClientMarkup.markupType === "flat") {
                        markup += resellerToClientMarkup.markup;
                    } else {
                        markup +=
                            (resellerToClientMarkup.markup *
                                flightResult[i].totalFare) /
                            100;
                    }
                }

                flightResult[i].totalFare += markup;
            }
            res.status(200).json({ response });
        } catch (err) {}
    },
};
