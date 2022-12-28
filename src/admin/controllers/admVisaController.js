const { isValidObjectId } = require("mongoose");

const { sendErrorResponse } = require("../../helpers");
const { Country, VisaType, Visa } = require("../../models");
const { visaSchema, visaTypeSchema } = require("../validations/visa.schema");

module.exports = {
    createNewVisa: async (req, res) => {
        try {
            const {
                country,
                name,
                documents,
                inclusions,
                description,
                faqs,
                details,
                keywords,
            } = req.body;

            const { _, error } = visaSchema.validate(req.body);
            if (error) {
                return sendErrorResponse(res, 400, error.details[0].message);
            }

            if (!isValidObjectId(country)) {
                return sendErrorResponse(res, 400, "Invalid country id");
            }

            const countryDetails = await Country.findById(country);
            if (!countryDetails) {
                return sendErrorResponse(res, 400, "Country not found");
            }

            if (!req.file?.path) {
                return sendErrorResponse(res, 400, "Sample visa is required");
            }

            let sampleVisa;
            if (req.file?.path) {
                sampleVisa = "/" + req.file.path.replace(/\\/g, "/");
            }

            const newVisa = new Visa({
                country,
                name,
                documents,
                inclusions,
                description,
                faqs,
                details,
                keywords,
                sampleVisa,
            });
            await newVisa.save();

            res.status(200).json(newVisa);
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    addNewVisaType: async (req, res) => {
        try {
            const {
                visa,
                visaName,
                processingTimeFormat,
                processingTime,
                stayPeriodFormat,
                stayPeriod,
                validityTimeFormat,
                validity,
                entryType,
                embassyCharge,
                serviceCharge,
                ageFrom,
                ageTo,
            } = req.body;

            const { _, error } = visaTypeSchema.validate(req.body);
            if (error) {
                return sendErrorResponse(res, 400, error.details[0].message);
            }

            if (!isValidObjectId(visa)) {
                return sendErrorResponse(res, 400, "Invalid country visa id");
            }

            const visaDetails = await Visa.findById(visa);
            if (!visaDetails) {
                return sendErrorResponse(res, 404, "Country Visa not found");
            }

            const newVisaType = new VisaType({
                visa,
                visaName,
                processingTimeFormat,
                processingTime,
                stayPeriodFormat,
                stayPeriod,
                validityTimeFormat,
                validity,
                entryType,
                embassyCharge,
                serviceCharge,
                ageFrom,
                ageTo,
            });
            await newVisaType.save();

            res.status(200).json(newVisaType);
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },
};
