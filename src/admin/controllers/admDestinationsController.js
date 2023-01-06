const { isValidObjectId } = require("mongoose");
const { sendErrorResponse } = require("../../helpers");
const { Destination, Country } = require("../../models");
const { destinationSchema } = require("../validations/destination.schema");

module.exports = {
    getAllDestinations: async (req, res) => {
        try {
            const { skip = 0, limit = 10 } = req.query;

            const destinations = await Destination.find({ isDeleted: false })
                .populate("country")
                .sort({ _id: -1 })
                .limit(limit)
                .skip(limit * skip)
                .lean();

            const totalDestinations = await Destination.find({
                isDeleted: false,
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

            const countryDetails = await Country.findOne({
                _id: country,
                isDeleted: false,
            });
            if (!countryDetails) {
                return sendErrorResponse(res, 404, "Country not found");
            }

            if (!req.file?.path) {
                return sendErrorResponse(res, 400, "Image is required");
            }

            let image;
            if (req.file?.path) {
                image = "/" + req.file.path.replace(/\\/g, "/");
            }

            const newDestination = new Destination({
                country,
                name,
                image,
            });
            await newDestination.save();

            const destinationObj = await Object(newDestination);
            destinationObj.country = countryDetails;

            res.status(200).json(destinationObj);
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    updateDestination: async (req, res) => {
        try {
            const { id } = req.params;
            const { country, name } = req.body;

            if (!isValidObjectId(country)) {
                return sendErrorResponse(res, 400, "Invalid country Id");
            }

            const countryDetails = await Country.findOne({
                _id: country,
                isDeleted: false,
            });
            if (!countryDetails) {
                return sendErrorResponse(res, 404, "Country not found");
            }

            if (!isValidObjectId(id)) {
                return sendErrorResponse(res, 400, "Invalid destination id");
            }

            let image;
            if (req.file?.path) {
                image = "/" + req.file.path.replace(/\\/g, "/");
            }

            const destination = await Destination.findOneAndUpdate(
                {
                    _id: id,
                    isDeleted: false,
                },
                { country, name, image },
                { runValidators: true, new: true }
            );

            if (!destination) {
                return sendErrorResponse(res, 404, "Destination not found");
            }

            const destinationObj = Object(destination);
            destinationObj.country = countryDetails;

            res.status(200).json(destinationObj);
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    deleteDestination: async (req, res) => {
        try {
            const { id } = req.params;

            if (!isValidObjectId(id)) {
                return sendErrorResponse(res, 400, "Invalid destination Id");
            }

            const destination = await Destination.findOneAndDelete({
                _id: id,
                isDeleted: false,
            });
            if (!destination) {
                return sendErrorResponse(res, 404, "Destination not found");
            }

            res.status(200).json({
                message: "Destination successfully deleted",
            });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },
};
