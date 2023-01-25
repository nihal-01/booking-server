const { sendErrorResponse } = require("../../helpers");
const { Country, Destination, Driver, Currency, HomeSettings } = require("../../models");

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
            const drivers = await Driver.find({ isDeleted: false }).sort({
                createdAt: -1,
            });
            const currencies = await Currency.find({})
                .populate("country", "countryName flag")
                .sort({ createdAt: -1 })
                .lean();
 

            const blogStatus = await HomeSettings.find({}).sort({ createdAt: -1 }).select({isBlogsEnabled : 1})

            console.log(blogStatus ,"blogStatus")

            res.status(200).json({
                destinations,
                countries,
                drivers,
                currencies,
                blogStatus
            });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },
};
