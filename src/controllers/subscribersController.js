const { sendErrorResponse } = require("../helpers");
const { Subscriber } = require("../model");
const { subscriberSchema } = require("../validations/subscriber.schema");

module.exports = {
    doSubscribe: async (req, res) => {
        try {
            const { email } = req.body;

            const { _, error } = subscriberSchema.validate(req.body);
            if (error) {
                return sendErrorResponse(res, 400, error.details[0].message);
            }

            const subscriber = await Subscriber.findOne({ email });
            if (subscriber) {
                return sendErrorResponse(
                    res,
                    400,
                    "You have already subscribed!"
                );
            }

            const newSubscriber = new Subscriber({ email });
            await newSubscriber.save();

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

        const subscriber = await Subscriber.findOneAndDelete({ email });
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
