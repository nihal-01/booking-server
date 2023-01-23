const { sendErrorResponse } = require("../../helpers");
const Reseller = require("../../b2b/models/reseller.model");
const { isValidObjectId } = require("mongoose");
const {
    resellerStatusUpdateSchema,
} = require("../validations/admResllers.schema");

module.exports = {
    getAllResellers: async (req, res) => {
        try {
            const { skip = 0, limit = 10, status } = req.query;

            const filters = {};

            if (status && status !== "") {
                filters.status = status;
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
            const { status } = req.body;

            const { _, error } = resellerStatusUpdateSchema.validate(req.body);
            if (error) {
                return sendErrorResponse(
                    res,
                    400,
                    error.details ? error?.details[0]?.message : error.message
                );
            }

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

            res.status(200).json({ reseller });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },
};
