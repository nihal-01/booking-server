const { isValidObjectId } = require("mongoose");

const { sendErrorResponse } = require("../../helpers");
const { Country, Currency } = require("../../models");

module.exports = {
    addCurrency: async (req, res) => {
        try {
            const { country } = req.body;

            const countryDetails = await Country.findOne({
                _id: country,
                isDeleted: false,
            });
            if (!countryDetails) {
                return sendErrorResponse(res, 400, "Country Not Found");
            }

            const currency = await Currency.findOne({ country });
            if (currency) {
                return sendErrorResponse(
                    res,
                    400,
                    `Sorry, ${countryDetails.countryName}'s currency already added`
                );
            }

            const newCurrency = new Currency({
                ...req.body,
                country,
            });
            await newCurrency.save();

            let currencyObj = Object(newCurrency);
            currencyObj.country = countryDetails;

            res.status(200).json(currencyObj);
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    getAllCurrencies: async (req, res) => {
        try {
            const currencies = await Currency.find({})
                .populate("country", "countryName logo")
                .sort({ createdAt: -1 })
                .lean();

            res.status(200).json(currencies);
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    updateCurrency: async (req, res) => {
        try {
            const { id } = req.params;
            const {
                country,
                currencyName,
                currencySymbol,
                isocode,
                conversionRate,
            } = req.body;

            if (!isValidObjectId(id)) {
                return sendErrorResponse(res, 400, "Invalid Country Id");
            }

            let countryDetails;
            if (country) {
                countryDetails = await Country.findOne({
                    isDeleted: false,
                    _id: country,
                });
                if (!countryDetails) {
                    return sendErrorResponse(res, 404, "Country not found");
                }
            }

            const currency = await Currency.findByIdAndUpdate(id, {
                country,
                currencyName,
                currencySymbol,
                isocode,
                conversionRate,
            });
            if (!currency) {
                return sendErrorResponse(res, 404, "Currency not found");
            }

            let currencyObj = Object(currency);
            currencyObj.country = countryDetails;

            res.status(200).json(currencyObj);
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    deleteCurrency: async (req, res) => {
        try {
            const { id } = req.params;

            if (!isValidObjectId(id)) {
                return sendErrorResponse(res, 400, "Invalid currency id");
            }

            const currency = await Currency.findByIdAndDelete(id);
            if (!currency) {
                return sendErrorResponse(res, 404, "Currency not found");
            }

            res.status(200).json({
                message: "Currency deleted successfully",
                _id: id,
            });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },
};
