const { isValidObjectId } = require("mongoose");
const { sendErrorResponse } = require("../helpers");
const { Visa, VisaType, VisaApplication } = require("../models");
const { visaApplicationInititeSchema } = require("../validations/visa.schema");

module.exports = {
    initiateVisaApplicationOrder: async (req, res) => {
        try {
            const { email, contactNo, visa, visaType, noOfTravellers } =
                req.body;

            const { _, error } = visaApplicationInititeSchema.validate(
                req.body
            );
            if (error) {
                return sendErrorResponse(res, 400, error.details[0].message);
            }

            if (!isValidObjectId(visa)) {
                return sendErrorResponse(res, 400, "Invalid visa id");
            }

            const visaDetails = await Visa.findById(visa);
            if (!visaDetails) {
                return sendErrorResponse(res, 404, "Visa details not found");
            }

            if (!isValidObjectId(visaType)) {
                return sendErrorResponse(res, 400, "Invalid visa type id");
            }

            const visaTypeDetails = await VisaType.findOne({ visaType, visa });
            if (!visaTypeDetails) {
                return sendErrorResponse(res, 400, "Visa Type not found");
            }

            const newVisaApplication = new VisaApplication({
                visaType,
                noOfTravellers,
                contactNo,
                email,
            });
            await newVisaApplication.save();

            res.status(200).json(newVisaApplication);
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    addVisaDetails: async (req, res) => {
        try {
            const { id } = req.params;
            const {
                visaType,
                noOfTravellers,
                onwardDate,
                returnDate,
                travellers,
            } = req.body;

            if (!isValidObjectId(id)) {
                return sendErrorResponse(res, 400, "Invalid order id");
            }

            const visaApplication = await VisaApplication.findByIdAndUpdate(
                id,
                {
                    visaType,
                    noOfTravellers,
                    onwardDate,
                    returnDate,
                    travellers,
                    isDetailsAdded: true,
                },
                { runValidators: true }
            );
            if (!visaApplication) {
                return sendErrorResponse(
                    res,
                    404,
                    "Visa application not found"
                );
            }

            res.status(200).json(visaApplication);
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },
};
