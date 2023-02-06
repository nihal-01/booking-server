const { Currency } = require("../../models");

// TODO
// 1. Add cache here
module.exports = {
    convertCurrency: async (amount, isocode) => {
        try {
            const currency = await Currency.findOne({ isocode });
            if (!currency) {
                return new Error("currency not found");
            }

            if (Number(amount) < 0) {
                return new Error("invalid amount");
            }

            const convertedAmount = (amount * currency?.conversionRate).toFixed(
                2
            );
            return convertedAmount;
        } catch (err) {
            throw err;
        }
    },
};
