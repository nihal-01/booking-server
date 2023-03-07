const { isValidObjectId } = require("mongoose");

const {
    b2bVisaMarkupSchema,
} = require("../../b2b/validations/b2bVisaMarkup.schema");
const { VisaType } = require("../../models");
const { B2cClientVisaMarkup } = require("../../models");
const { sendErrorResponse } = require("../../helpers");

module.exports = {
    visaListForMarkup: async (req, res) => {
        try {
            const visaType = await VisaType.aggregate([
                {
                    $match: {
                        isDeleted: false,
                    },
                },
                {
                    $lookup: {
                        from: "visas",
                        localField: "visa",
                        foreignField: "_id",
                        as: "visa",
                    },
                },
                {
                    $lookup: {
                        from: "b2cvisamarkups",
                        let: {
                            visaType: "$_id",
                        },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            {
                                                $eq: [
                                                    "$visaType",
                                                    "$$visaType",
                                                ],
                                            },
                                        ],
                                    },
                                },
                            },
                        ],
                        as: "B2cMarkup",
                    },
                },
                {
                    $lookup: {
                        from: "countries",
                        localField: "visa.country",
                        foreignField: "_id",
                        as: "country",
                    },
                },

                {
                    $set: {
                        visa: { $arrayElemAt: ["$country.countryName", 0] },
                        B2cMarkup: { $arrayElemAt: ["$B2cMarkup", 0] },
                    },
                },
            ]);

            // const countryDetails = await Country.findById(country);

            console.log(visaType, "visaType");

            res.status(200).json(visaType);
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    upsertB2cClientVisaMarkup: async (req, res) => {
        try {
            const { markupType, markup, visaType } = req.body;

            const { _, error } = b2bVisaMarkupSchema.validate(req.body);
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

            const b2bClientVisaMarkups =
                await B2cClientVisaMarkup.findOneAndUpdate(
                    {
                        visaType,
                    },
                    {
                        visaType,
                        markupType,
                        markup,
                    },
                    { upsert: true, new: true, runValidators: true }
                );

            res.status(200).json(b2bClientVisaMarkups);
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },
};
