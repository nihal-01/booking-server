const { isValidObjectId } = require("mongoose");
const { sendErrorResponse } = require("../../helpers");
const { B2CAttractionMarkup, Attraction } = require("../../models");

module.exports = {
    addB2cAttractionMarkup: async (req, res) => {
        try {
            const { markupType, markup, attraction } = req.body;

            if (!isValidObjectId(attraction)) {
                return sendErrorResponse(res, 400, "Invalid attraction id");
            }

            const attractionDetail = await Attraction.findOne({
                _id: attraction,
                isDeleted: false,
            });
            if (!attractionDetail) {
                return sendErrorResponse(res);
            }
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    deleteB2cAttractionMarkup: async (req, res) => {
        try {
            const { id } = req.params;

            if (!isValidObjectId(id)) {
                return sendErrorResponse(res, 400, "Invalid markup id");
            }

            const b2cAttractionMarkup =
                await B2CAttractionMarkup.findByIdAndDelete(id);

            if (!b2cAttractionMarkup) {
                return sendErrorResponse(
                    res,
                    404,
                    "B2C Attraction markup not found"
                );
            }

            res.status(200).json({
                message: "b2c attraction markup deleted successfully",
            });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },
};
