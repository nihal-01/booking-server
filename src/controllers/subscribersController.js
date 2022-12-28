const { sendErrorResponse } = require("../helpers");
const { Subscriber } = require("../models");
const { subscriberSchema } = require("../validations/subscriber.schema");

module.exports = {
    doSubscribe: async (req, res) => {
        try {
            const { email } = req.body;

            const { _, error } = subscriberSchema.validate(req.body);
            if (error) {
                return sendErrorResponse(res, 400, error.details[0].message);
            }

            await Subscriber.findOneAndUpdate(
                { email },
                { subscribed: true },
                { upsert: true, runValidators: true }
            );

            res.status(200).json({
                message:
                    "You have successfully subscribed to our news letter. Thank you",
            });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    doUnsubscribe: async (req, res) => {
        const { email } = req.body;

        const { _, error } = subscriberSchema.validate(req.body);
        if (error) {
            return sendErrorResponse(res, 400, error.details[0].message);
        }

        const subscriber = await Subscriber.findOneAndUpdate(
            { email },
            { subscribed: false }
        );
        if (!subscriber) {
            return sendErrorResponse(
                res,
                404,
                `This email ${email} is not already subscribed`
            );
        }

        res.status(200).json({
            message: "You have successfully unsubscribed",
            email,
        });
    },
};
