const { sendErrorResponse } = require("../../helpers");
const { AttractionOrder, User } = require("../../models");

module.exports = {
    getDashboardData: async (req, res) => {
        try {
            const totalUsers = await User.count();

            const recentOrders = await AttractionOrder.aggregate([
                { $match: { status: { $ne: "pending" } } },
                {
                    $lookup: {
                        from: "users",
                        localField: "user",
                        foreignField: "_id",
                        as: "user",
                    },
                },
                {
                    $set: {
                        user: { $arrayElemAt: ["$user", 0] },
                    },
                },
                { $unwind: "$activities" },
                {
                    $lookup: {
                        from: "attractionactivities",
                        localField: "activities.activity",
                        foreignField: "_id",
                        as: "activity",
                    },
                },
                {
                    $set: {
                        activity: {
                            $arrayElemAt: ["$activity", 0],
                        },
                    },
                },
                {
                    $project: {
                        activity: {
                            name: 1,
                        },
                        activities: 1,
                        bookingType: 1,
                        user: {
                            name: 1,
                            email: 1,
                        },
                        orderId: 1,
                    },
                },
                {
                    $sort: { createdAt: -1 },
                },
            ]);

            res.status(200).json({ totalUsers });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },
};
