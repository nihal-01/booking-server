const { sendErrorResponse } = require("../../helpers");
const { Country } = require("../../models");
const { countrySchema } = require("../validations/country.schema");

module.exports = {
    getAllCountries: async (req, res) => {
        try {
            const { skip = 0, limit = 10 } = req.query;

            const countries = await Country.find({})
                .sort({ _id: -1 })
                .limit(limit)
                .skip(limit * skip);

            const totalCountries = await Country.find({}).count();

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
};
