const { sendErrorResponse } = require("../../helpers");
const { Country, Destination, Driver } = require("../../models");

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
            const drivers = await Driver.find({ isDeleted: false });

            res.status(200).json({ destinations, countries, drivers });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },
};
