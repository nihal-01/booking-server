const { sendErrorResponse } = require("../../helpers");
const { User } = require("../../models");

module.exports = {
    getAllUsers: async (req, res) => {
        try {
            const { limit = 10, skip = 0 } = req.query;

            const users = await User.find({})
                .populate("country")
                .sort({ createdAt: -1 })
                .limit(limit)
                .skip(limit * skip)
                .lean();

            const totalUsers = await User.count();

            res.status(200).json({
                users,
                totalUsers,
                skip: Number(skip),
                limit: Number(limit),
            });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },
};
