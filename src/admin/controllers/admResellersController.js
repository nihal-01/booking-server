const { sendErrorResponse } = require("../../helpers");
const Reseller = require("../../b2b/models/reseller.model");
const { isValidObjectId } = require("mongoose");
const {
    resellerStatusUpdateSchema,
} = require("../validations/admResllers.schema");
const {
    B2BWallet,
    B2BTransaction,
    B2BSpecialVisaMarkup,
    B2BSpecialAttractionMarkup,
} = require("../../b2b/models");
const adminApprovalEmail = require("../helpers/adminApprovalEmail");

module.exports = {
    getAllResellers: async (req, res) => {
        try {
            const { skip = 0, limit = 10, status, companyName } = req.query;

            const filters = { role: "reseller" };

            if (status && status !== "") {
                filters.status = status;
            }

            if (companyName && companyName !== "") {
                filters.companyName = {
                    $regex: companyName,
                    $options: "i",
                };
            }

            const resellers = await Reseller.find(filters)
                .populate("country", "countryName logo phonecode")
                .select(
                    "agentCode country companyName email avatar name website phoneNumber status"
                )
                .sort({ createdAt: -1 })
                .limit(limit)
                .skip(limit * skip)
                .lean();

            const totalResellers = await Reseller.find(filters).count();

            res.status(200).json({
                resellers,
                skip: Number(skip),
                limit: Number(limit),
                totalResellers,
            });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    changeResellerStatus: async (req, res) => {
        try {
            const { id } = req.params;
            const { status, formData } = req.body;
            const {
                attractionMarkupType,
                attractionMarkup,
                visaMarkupType,
                visaMarkup,
            } = formData;

            console.log(formData, visaMarkup, attractionMarkup, "visaMarkup");

            // const { _, error } = resellerStatusUpdateSchema.validate(req.body);
            // if (error) {
            //   return sendErrorResponse(
            //     res,
            //     400,
            //     error.details ? error?.details[0]?.message : error.message
            //   );
            // }

            if (!isValidObjectId(id)) {
                return sendErrorResponse(res, 400, "Invalid reseller id");
            }

            const reseller = await Reseller.findByIdAndUpdate(
                id,
                { status },
                { runValidators: true }
            );

            if (!reseller) {
                return sendErrorResponse(res, 404, "Reseller not found");
            }

            if (status === "ok" && !attractionMarkupType == "") {
                await B2BSpecialAttractionMarkup.findOneAndUpdate(
                    {
                        resellerId: reseller._id,
                    },
                    {
                        markupType: attractionMarkupType,
                        markup: attractionMarkup,
                    },
                    { upsert: true, new: true }
                );
            }

            if (status === "ok" && !visaMarkupType == "") {
                await B2BSpecialVisaMarkup.findOneAndUpdate(
                    {
                        resellerId: reseller._id,
                    },
                    {
                        markupType: visaMarkupType,
                        markup: visaMarkup,
                    },
                    { upsert: true, new: true }
                );
            }

            let email = reseller.email;
            if (status == "ok") {
                adminApprovalEmail(
                    email,
                    "Admin Account Approval Status",
                    "Your Account Has Been Approved By The Admin"
                );
            } else {
                adminApprovalEmail(
                    email,
                    " Admin Account Approval Status",
                    " Unfortunately  Your Account Has Been Cancelled By The Admin"
                );
            }

            res.status(200).json({
                message: `status successfully changed to ${status}`,
            });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    getSingleReseller: async (req, res) => {
        try {
            const { id } = req.params;

            if (!isValidObjectId(id)) {
                return sendErrorResponse(res, 400, "Invalid reseller id");
            }

            const reseller = await Reseller.findById(id)
                .populate("country", "countryName flag phonecode")
                .lean();

            if (!reseller) {
                return sendErrorResponse(res, 404, "Reseller not found");
            }

            const wallet = await B2BWallet.findOne({ reseller: reseller?._id });

            let totalEarnings = [];
            let pendingEarnings = [];
            if (wallet) {
                totalEarnings = await B2BTransaction.aggregate([
                    {
                        $match: {
                            reseller: reseller?._id,
                            status: "success",
                            transactionType: "markup",
                        },
                    },
                    {
                        $group: {
                            _id: null,
                            total: { $sum: "$amount" },
                        },
                    },
                ]);

                pendingEarnings = await B2BTransaction.aggregate([
                    {
                        $match: {
                            reseller: reseller?._id,
                            status: "pending",
                            transactionType: "markup",
                        },
                    },
                    {
                        $group: {
                            _id: null,
                            total: { $sum: "$amount" },
                        },
                    },
                ]);
            }

            res.status(200).json({
                reseller,
                balance: wallet ? wallet.balance : 0,
                totalEarnings: totalEarnings[0]?.total || 0,
                pendingEarnings: pendingEarnings[0]?.total || 0,
            });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    getSingleResellersSubagents: async (req, res) => {
        try {
            const { resellerId } = req.params;
            const { skip = 0, limit = 10 } = req.params;

            if (!isValidObjectId(resellerId)) {
                return sendErrorResponse(res, 400, "invalid reseller id");
            }

            const reseller = await Reseller.findById(resellerId);
            if (!reseller) {
                return sendErrorResponse(res, 404, "reseller not found");
            }

            const subAgents = await Reseller.find({ referredBy: resellerId })
                .populate("country", "flag phonecode countryName")
                .sort({ createdAt: -1 })
                .limit(limit)
                .skip(limit * skip)
                .lean();
            const totalSubAgents = await Reseller.find({
                referredBy: resellerId,
            }).count();

            res.status(200).json({
                subAgents,
                totalSubAgents,
                skip: Number(skip),
                limit: Number(limit),
            });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },
};
