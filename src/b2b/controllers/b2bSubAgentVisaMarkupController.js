const { isValidObjectId, Types } = require("mongoose");
const { sendErrorResponse } = require("../../helpers");
const { VisaType } = require("../../models");
const { B2BSubAgentVisaMarkup } = require("../models");
const { b2bVisaMarkupSchema } = require("../validations/b2bVisaMarkup.schema");



module.exports = {
    upsertB2bSubAgentVisaMarkup: async (req, res) => {
        try {
            const { markupType, markup, visaType } = req.body;

            const { _, error } = b2bVisaMarkupSchema.validate(
                req.body
            );
            if (error) {
                return sendErrorResponse(res, 400, error.details[0]?.message);
            }

            if (!isValidObjectId(visaType)) {
                return sendErrorResponse(res, 400, "Invalid visaType id");
            }

            const visaDetail = await VisaType.findOne({
                _id: visaType,
                isDeleted: false,
            });
            if (!visaDetail) {
                return sendErrorResponse(res, 400, "VisaType Not Found");
            }

            const b2bSubAgentVisaMarkups =
                await B2BSubAgentVisaMarkup.findOneAndUpdate(
                    {
                        visaType,
                    },
                    {
                        visaType,
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

            res.status(200).json(b2bSubAgentVisaMarkups);
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

   
};