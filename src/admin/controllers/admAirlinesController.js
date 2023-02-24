const { isValidObjectId } = require("mongoose");
const { sendErrorResponse } = require("../../helpers");
const { Airline } = require("../../models");
const { airlineSchema } = require("../validations/admAirline.schema");

module.exports = {
    addNewAirline: async (req, res) => {
        try {
            const { _, error } = airlineSchema.validate(req.body);
            if (error) {
                return sendErrorResponse(res, 400, error.details[0].message);
            }

            let image;
            if (!req.file?.path) {
                return sendErrorResponse(res, 400, "airline image is required");
            } else {
                image = "/" + req.file.path.replace(/\\/g, "/");
            }

            const newAirline = new Airline({
                ...req.body,
                image,
                isActive: true,
                isDeleted: false,
            });
            await newAirline.save();

            res.status(200).json({
                message: "new airline added successfully",
                _id: newAirline._id,
            });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    updateAirline: async (req, res) => {
        try {
            const { id } = req.params;

            if (!isValidObjectId(id)) {
                return sendErrorResponse(res, 400, "invalid airline id");
            }

            const { _, error } = airlineSchema.validate(req.body);
            if (error) {
                return sendErrorResponse(res, 400, error.details[0].message);
            }

            let image;
            if (req.file?.path) {
                image = "/" + req.file.path.replace(/\\/g, "/");
            }

            const airline = await Airline.findOneAndUpdate(
                { _id: id, isDeleted: false },
                {
                    ...req.body,
                    image,
                },
                { new: true, runValidators: true }
            );
            if (!airline) {
                return sendErrorResponse(res, 404, "airline not found");
            }

            res.status(200).json({
                message: "airline successfully updated",
                _id: id,
            });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    deleteAirline: async (req, res) => {
        try {
            const { id } = req.params;

            if (!isValidObjectId(id)) {
                return sendErrorResponse(res, 400, "invalid airline id");
            }

            const airline = await Airline.findOneAndDelete({
                _id: id,
                isDeleted: false,
            });
            if (!airline) {
                return sendErrorResponse(res, 404, "airline not found");
            }

            res.status(200).json({
                message: "airline successfully deleted",
                _id: id,
            });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    getAllAirlines: async (req, res) => {
        try {
            const { skip = 0, limit = 10 } = req.params;

            const airlines = await Airline.find({ isDeleted: false })
                .sort({ createdAt: -1 })
                .limit(limit)
                .skip(limit * skip)
                .lean();

            const totalAirlines = await Airline.findOne({
                isDeleted: false,
            }).count();

            res.status(200).json({
                airlines,
                totalAirlines,
                skip: Number(skip),
                limit: Number(limit),
            });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    getSingleAirline: async (req, res) => {
        try {
            const { id } = req.params;

            if (!isValidObjectId(id)) {
                return sendErrorResponse(res, 400, "invalid airline id");
            }

            const airline = await Airline.findOne({
                _id: id,
                isDeleted: false,
            });
            if (!airline) {
                return sendErrorResponse(res, 404, "airline not found");
            }

            res.status(200).json(airline);
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },
};
