const { sendErrorResponse } = require("../../helpers");
const { Currency } = require("../../models");

// TODO
// 1. Add cache here
module.exports = {
    convertCurrency: async (amount, currencySymbol) => {
        try {
            const currency = await Currency.findOne({ currencySymbol });
            if (!currency) {
                return new Error("currency not found");
            }

            if (Number(amount) < 0) {
                return new Error("invalid amount");
            }

            const convertedAmount = amount * currency?.conversionRate;
            return convertedAmount;
        } catch (err) {
            throw err;
        }
    },
};
