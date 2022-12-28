const { sendErrorResponse } = require("../../helpers");
const { Subscriber } = require("../../models");

module.exports = {
    getAllSubscribers: async (req, res) => {
        try {
            const { skip = 0, limit = 10, subscribed } = req.query;

            const filters = { subscribed: true };

            if (subscribed && subscribed !== "") {
                filters.subscribed = subscribed === "true";
            }

            const subscribers = await Subscriber.find(filters)
                .sort({ createdAt: -1 })
                .limit(limit)
                .skip(limit * skip);

            const totalSubscribers = await Subscriber.find(filters).count();

            res.status(200).json({
                subscribers,
                totalSubscribers,
                skip: Number(skip),
                limit: Number(limit),
            });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },
};
