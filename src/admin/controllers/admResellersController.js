const { sendErrorResponse } = require("../../helpers");
const Reseller = require("../../b2b/models/reseller.model");

module.exports = {
    getAllResellers: async (req, res) => {
        try {
            const { skip = 0, limit = 10, status } = req.query;

            const filters = {};

            if (status && status !== "") {
                filters.status = status;
            }

            const resellers = await Reseller.find(filters)
                // .populate("country")
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
};
