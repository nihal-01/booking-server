const { isValidObjectId, Types } = require("mongoose");
const { sendErrorResponse } = require("../../helpers");
const { VisaType, Airline } = require("../../models");
const {
    B2BClientVisaMarkup,
    B2BSubAgentFlightMarkup,
    B2BClientFlightMarkup,
} = require("../models");
const { b2bFightMarkupSchema } = require("../validations/b2bFlightMarkSchema");

module.exports = {
    upsertB2bClientFlightMarkup: async (req, res) => {
        try {
            const { markupType, markup, airline } = req.body;

            const { _, error } = b2bFightMarkupSchema.validate(req.body);
            if (error) {
                return sendErrorResponse(res, 400, error.details[0]?.message);
            }

            if (!isValidObjectId(airline)) {
                return sendErrorResponse(res, 400, "Invalid Airline Id");
            }

            const airlineDetail = await Airline.findOne({
                _id: airline,
                isDeleted: false,
            });
            if (!airlineDetail) {
                return sendErrorResponse(res, 400, "Airline Not Found");
            }

            const b2bClientFlightMarkups =
                await B2BClientFlightMarkup.findOneAndUpdate(
                    {
                        airline,
                    },
                    {
                        airline,
                        markupType,
                        markup,
                        resellerId: req.reseller._id,
                    },
                    { upsert: true, new: true, runValidators: true }
                );

            // let tempObj = Object(b2bClientVisaMarkups);
            // tempObj.attraction = {
            //     _id: attractionDetail?._id,
            //     title: attractionDetail?.title,
            // };

            res.status(200).json(b2bClientFlightMarkups);
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    upsertB2bSubAgentFlightMarkup: async (req, res) => {
        try {
            const { markupType, markup, airline } = req.body;

            const { _, error } = b2bFightMarkupSchema.validate(req.body);
            if (error) {
                return sendErrorResponse(res, 400, error.details[0]?.message);
            }

            if (!isValidObjectId(airline)) {
                return sendErrorResponse(res, 400, "Invalid visaType id");
            }

            const airlineDetail = await Airline.findOne({
                _id: airline,
                isDeleted: false,
            });
            if (!airlineDetail) {
                return sendErrorResponse(res, 400, "VisaType Not Found");
            }

            const b2bSubAgentFlightMarkups =
                await B2BSubAgentFlightMarkup.findOneAndUpdate(
                    {
                        airline,
                    },
                    {
                        airline,
                        markupType,
                        markup,
                        resellerId: req.reseller._id,
                    },
                    { upsert: true, new: true, runValidators: true }
                );

            // let tempObj = Object(b2bClientVisaMarkups);
            // tempObj.attraction = {
            //     _id: attractionDetail?._id,
            //     title: attractionDetail?.title,
            // };

            res.status(200).json(b2bSubAgentFlightMarkups);
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },
};
