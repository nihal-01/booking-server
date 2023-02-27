const { sendErrorResponse } = require("../helpers");
const { Visa, VisaType } = require("../models");
const { isValidObjectId, Types } = require("mongoose");

module.exports = {
    listVisa: async (req, res) => {
        try {
            // const { countryName} = req.query

            const visaCountry = await Visa.find({ isDeleted: false }).populate({
                path: "country",
                select: "countryName",
            });

            if (!visaCountry) {
                return sendErrorResponse(res, 400, "No Visa Available");
            }

            //   const filteredVisaCountry = visaCountry.filter(visa => {
            //     return visa.country.countryName.match(new RegExp(countryName, "i"));
            // });

            // if (!filteredVisaCountry) {
            //   return sendErrorResponse(res, 400, "No Visa Available");
            // }

            res.status(200).json(visaCountry);
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    listVisaType: async (req, res) => {
        try {
            const { id } = req.params;

            if (!isValidObjectId(id)) {
                return sendErrorResponse(res, 400, "Invalid VisaType id");
            }

            let visa = await Visa.findOne({
                _id: id,
                isDeleted: false,
            }).populate("country");

            if (!visa) {
                return sendErrorResponse(res, 400, "No Visa ");
            }

            const visaType = await VisaType.aggregate([
                {
                    $match: {
                        visa: Types.ObjectId(id),
                        isDeleted: false,
                    },
                },

                {
                    $lookup: {
                        from: "b2cclientvisamarkups",
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
                        as: "markupClient",
                    },
                },

                {
                    $set: {
                        markupClient: { $arrayElemAt: ["$markupClient", 0] },
                    },
                },
                {
                    $addFields: {
                        totalPrice: {
                            $cond: [
                                {
                                    $eq: [
                                        "$markupClient.markupType",
                                        "percentage",
                                    ],
                                },

                                {
                                    $sum: [
                                        "$visaPrice",
                                        {
                                            $divide: [
                                                {
                                                    $multiply: [
                                                        "$markupClient.markup",
                                                        "$visaPrice",
                                                    ],
                                                },
                                                100,
                                            ],
                                        },
                                    ],
                                },

                                {
                                    $sum: [
                                        "$visaPrice",
                                        "$markupClient.markup",
                                    ],
                                },
                            ],
                        },
                    },
                },
            ]);

            if (!visaType) {
                return sendErrorResponse(res, 400, "No visaType ");
            }

            res.status(200).json({
                visa,
                visaType,
            });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },
};
