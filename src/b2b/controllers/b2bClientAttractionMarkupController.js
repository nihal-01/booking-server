const { isValidObjectId, Types } = require("mongoose");
const { sendErrorResponse } = require("../../helpers");
const { Attraction } = require("../../models");
const { B2BClientAttractionMarkup } = require("../models");
const {
    b2bClientAttractionMarkupSchema,
} = require("../validations/b2bClientAttractionMarkupSchema");

module.exports = {
    upsertB2bClientAttractionMarkup: async (req, res) => {
        try {
            const { markupType, markup, attraction } = req.body;

            const { _, error } = b2bClientAttractionMarkupSchema.validate(
                req.body
            );
            if (error) {
                return sendErrorResponse(res, 400, error.details[0]?.message);
            }

            if (!isValidObjectId(attraction)) {
                return sendErrorResponse(res, 400, "Invalid attraction id");
            }

            const attractionDetail = await Attraction.findOne({
                _id: attraction,
                isDeleted: false,
            });
            if (!attractionDetail) {
                return sendErrorResponse(res, 400, "Attraction Not Found");
            }

            const b2bClientAttractionMarkups =
                await B2BClientAttractionMarkup.findOneAndUpdate(
                    {
                        attraction,
                    },
                    {
                        attraction,
                        markupType,
                        markup,
                        resellerId: req.reseller._id,
                    },
                    { upsert: true, new: true, runValidators: true }
                );

            let tempObj = Object(b2bClientAttractionMarkups);
            tempObj.attraction = {
                _id: attractionDetail?._id,
                title: attractionDetail?.title,
            };

            res.status(200).json(tempObj);
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    deleteB2bClientAttractionMarkup: async (req, res) => {
        try {
            const { id } = req.params;

            if (!isValidObjectId(id)) {
                return sendErrorResponse(res, 400, "Invalid markup id");
            }

            const b2bClientAttractionMarkups =
                await B2BClientAttractionMarkup.findByIdAndDelete(id);

            if (!b2bClientAttractionMarkups) {
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
