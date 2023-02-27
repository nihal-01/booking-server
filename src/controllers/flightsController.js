const { sendErrorResponse } = require("../helpers");

module.exports = {
    searchFlightAvailability: async (req, res) => {
        try {
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },
};
