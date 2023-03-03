const {
    availabilitySearchSchema,
} = require("../../validations/flightApi.schema");
const { flightAvailabilitySearch } = require("../helpers");

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

            console.log(req.body, "body");

            const { _, error } = availabilitySearchSchema.validate(req.body);
            if (error) {
                return sendErrorResponse(res, 400, error.details[0].message);
            }

            const data = await flightAvailabilitySearch(req.body);

            console.log(data, "data");
            res.status(200).json(data);
        } catch (err) {}
    },
};
