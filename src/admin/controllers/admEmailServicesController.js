const { isValidObjectId } = require("mongoose");
const { sendErrorResponse } = require("../../helpers");
const { EmailService } = require("../models");
const {
    emailServiceSchema,
} = require("../validations/admEmailServices.schema");

module.exports = {
    addNewEmailService: async (req, res) => {
        try {
            const { serviceProvider, apiKey } = req.body;

            const { _, error } = emailServiceSchema.validate(req.body);
            if (error) {
                return sendErrorResponse(res, 400, error.details[0].message);
            }

            const prevEmailService = await EmailService.findOne({
                serviceProvider,
            });
            if (prevEmailService) {
                return sendErrorResponse(
                    res,
                    400,
                    "An Email service already added with this service provider"
                );
            }

            const newEmailService = new EmailService({
                serviceProvider,
                apiKey,
            });
            await newEmailService.save();

            res.status(200).json(newEmailService);
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    updateEmailService: async (req, res) => {
        try {
            const { id } = req.params;
            const { serviceProvider, apiKey } = req.body;

            const { _, error } = emailServiceSchema.validate(req.body);
            if (error) {
                return sendErrorResponse(res, 400, error.details[0].message);
            }

            if (!isValidObjectId(id)) {
                return sendErrorResponse(res, 400, "Invalid email service id");
            }

            const prevEmailService = await EmailService.findOne({
                _id: { $ne: id },
                serviceProvider,
            });
            if (prevEmailService) {
                return sendErrorResponse(
                    res,
                    400,
                    "Aleady an email service added with this service provider"
                );
            }

            const emailService = await EmailService.findById(
                id,
                {
                    serviceProvider,
                    apiKey,
                },
                { runValidators: true, new: true }
            );
            if (!emailService) {
                return sendErrorResponse(res, 404, "Email service not found");
            }

            res.status(200).json(emailService);
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    deleteEmailService: async (req, res) => {
        try {
            const { id } = req.params;

            if (!isValidObjectId(id)) {
                return sendErrorResponse(res, 400, "Invalid email service id");
            }

            const emailService = await EmailService.findByIdAndDelete(id);
            if (!emailService) {
                return sendErrorResponse(res, 404, "Email service not found");
            }

            res.status(200).json({
                message: "Email service successfully deleted",
                _id: id,
            });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    getAllEmailServices: async (req, res) => {
        try {
            const emailServices = await EmailService.find({}).sort({
                createdAt: -1,
            });

            res.status(200).json(emailServices);
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },
};
