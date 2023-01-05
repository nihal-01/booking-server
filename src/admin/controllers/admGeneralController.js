const { sendErrorResponse } = require("../../helpers");
const { Country, Destination } = require("../../models");

module.exports = {
    getGeneralData: async (req, res) => {
        try {
            const countries = await Country.find({ isDeleted: false }).sort({
                createdAt: -1,
            });
            const destinations = await Destination.find({ isDeleted: false })
                .populate("country")
                .sort({ createdAt: -1 })
                .lean();

            res.status(200).json({ destinations, countries });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },
};
