const { sendErrorResponse } = require("../helpers");

module.exports = {
    getFlightAvaialability: async (req, res) => {
        try {
            const {
                from,
                to,
                departureDate,
                noOfAdults,
                noOfChildrens,
                noOfInfants,
            } = req.body;

            
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },
};
