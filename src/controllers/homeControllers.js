const { sendErrorResponse } = require("../helpers");
const { HomeSettings } = require("../models");

module.exports = {
    getHomeData: async (req, res) => {
        try {
            const home = await HomeSettings.findOne({
                settingsNumber: 1,
            })
                .populate({
                    path: "bestSellingAttractions",
                    populate: { path: "category", select: "categoryName" },
                    select: "title images category",
                })
                .populate({
                    path: "bestSellingAttractions",
                    populate: { path: "category", select: "categoryName" },
                    select: "title images category",
                })
                .lean();

            if (!home) {
                return sendErrorResponse(
                    res,
                    404,
                    "Home settings not added yet."
                );
            }

            res.status(200).json(home);
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },
};
