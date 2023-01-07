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

            const newCurrency = new Currency({
                ...req.body,
                country,
            });
            await newCurrency.save();

            res.status(200).json(newCurrency);
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

            // const country = await 
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },
};
