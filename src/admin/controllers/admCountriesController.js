const { isValidObjectId } = require("mongoose");

const { sendErrorResponse } = require("../../helpers");
const { Country } = require("../../models");
const { countrySchema } = require("../validations/country.schema");

module.exports = {
    getAllCountries: async (req, res) => {
        try {
            const { skip = 0, limit = 10 } = req.query;

            const countries = await Country.find({ isDeleted: false })
                .sort({ _id: -1 })
                .limit(limit)
                .skip(limit * skip);

            const totalCountries = await Country.find({
                isDeleted: false,
            }).count();

            res.status(200).json({
                countries,
                totalCountries,
                skip: Number(skip),
                limit: Number(limit),
            });
        } catch (err) {
            return sendErrorResponse(res, 500, err);
        }
    },

    addNewCountry: async (req, res) => {
        try {
            const { isocode, phonecode } = req.body;

            const { _, error } = countrySchema.validate(req.body);
            if (error) {
                return sendErrorResponse(res, 400, error.details[0].message);
            }

            const country = await Country.findOne({
                isocode: isocode?.toUpperCase(),
                isDeleted: false,
            });
            if (country) {
                return sendErrorResponse(
                    res,
                    400,
                    "This Country already exists"
                );
            }

            const newCountry = new Country({
                ...req.body,
                phonecode: !phonecode?.startsWith("+")
                    ? "+" + phonecode
                    : phonecode,
            });
            await newCountry.save();

            res.status(200).json(newCountry);
        } catch (err) {
            return sendErrorResponse(res, 500, err);
        }
    },

    deleteCountry: async (req, res) => {
        try {
            const { id } = req.params;

            if (!isValidObjectId(id)) {
                return sendErrorResponse(res, 400, "Invalid country id");
            }

            const country = await Country.findOneAndUpdate(
                { _id: id, isDeleted: false },
                {
                    isDeleted: true,
                }
            );
            if (!country) {
                return sendErrorResponse(res, 404, "Country not found");
            }

            res.status(200).json({
                message: "Country deleted successfully",
                _id: id,
            });
        } catch (err) {
            return sendErrorResponse(res, 500, err);
        }
    },

    updateCountry: async (req, res) => {
        try {
            const { id } = req.params;
            const { countryName, isocode, phonecode, flag } = req.body;

            const { _, error } = countrySchema.validate(req.body);
            if (error) {
                return sendErrorResponse(res, 400, error.details[0].message);
            }

            if (!isValidObjectId) {
                return sendErrorResponse(res, 400, "Invalid country Id");
            }

            const country = await Country.findOneAndUpdate(
                { _id: id, isDeleted: false },
                {
                    countryName,
                    isocode,
                    phonecode,
                    flag,
                },
                { runValidators: true, new: true }
            );

            if (!country) {
                return sendErrorResponse(res, 404, "Country not found");
            }

            res.status(200).json(country);
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },
};
