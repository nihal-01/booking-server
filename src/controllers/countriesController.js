const { sendErrorResponse } = require("../helpers");
const { Country } = require("../models");

module.exports = {
    getAllCountries: async (req, res) => {
        try {
            const countries = await Country.find({ isDeleted: false });
            res.status(200).json(countries);
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },
};
