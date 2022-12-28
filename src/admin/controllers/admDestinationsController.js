const { isValidObjectId } = require("mongoose");
const { sendErrorResponse } = require("../../helpers");
const { Destination, Country } = require("../../models");
const { destinationSchema } = require("../validations/destination.schema");

module.exports = {
    getAllDestinationsByCountry: async (req, res) => {
        try {
            const { countryId } = req.params;
            const { skip = 0, limit = 10 } = req.query;

            if (!isValidObjectId(countryId)) {
                return sendErrorResponse(res, 400, "Invalid countryId");
            }

            const country = await Country.findById(countryId);
            if (!country) {
                return sendErrorResponse(res, 404, "Country not found!");
            }

            const destinations = await Destination.find({
                country: countryId,
            })
                .sort({ _id: -1 })
                .limit(limit)
                .skip(limit * skip);

            const totalDestinations = await Destination.find({
                country: countryId,
            }).count();

            res.status(200).json({
                destinations,
                totalDestinations,
                skip: Number(skip),
                limit: Number(limit),
            });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    addNewDestination: async (req, res) => {
        try {
            const { country, name } = req.body;

            const { _, error } = destinationSchema.validate(req.body);
            if (error) {
                return sendErrorResponse(res, 400, error.details[0].message);
            }

            if (!isValidObjectId(country)) {
                return sendErrorResponse(res, 400, "Invalid country id");
            }

            const countryDetails = await Country.findById(country);
            if (!countryDetails) {
                return sendErrorResponse(res, 404, "Country not found");
            }

            const newDestination = new Destination({
                country,
                name,
            });
            await newDestination.save();

            res.status(200).json(newDestination);
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },
};
