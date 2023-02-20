const { isValidObjectId } = require("mongoose");
const { sendErrorResponse } = require("../../helpers");
const { ApiMaster } = require("../../models");
const { apiSchema } = require("../validations/admApiMaster.schema");

module.exports = {
    addNewApi: async (req, res) => {
        try {
            const { _, error } = apiSchema.validate(req.body);
            if (error) {
                return sendErrorResponse(res, 400, error.details[0].message);
            }

            const newApi = new ApiMaster({
                ...req.body,
            });
            await newApi.save();

            res.status(200).json({
                message: "new api successfully added",
                _id: newApi?._id,
                apiCode: newApi.apiCode,
            });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    deleteApi: async (req, res) => {
        try {
            const { apiId } = req.params;

            if (!isValidObjectId(apiId)) {
                return sendErrorResponse(res, 400, "invalid api id");
            }

            const api = await ApiMaster.findByIdAndDelete(apiId);
            if (!api) {
                return sendErrorResponse(res, 400, "api not found");
            }

            res.status(200).json({ message: "api successfully deleted" });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    updateApi: async (req, res) => {
        try {
            const { apiId } = req.params;

            if (!isValidObjectId(apiId)) {
                return sendErrorResponse(res, 400, "invalid api id");
            }

            const { _, error } = apiSchema.validate(req.body);
            if (error) {
                return sendErrorResponse(res, 400, error.details[0].message);
            }

            const api = await ApiMaster.findByIdAndUpdate(apiId, {
                ...req.body,
            });
            if (!api) {
                return sendErrorResponse(res, 500, "api not found");
            }

            res.status(200).json({
                message: "api successfully updated",
                _id: api._id,
                apiCode: api.apiCode,
            });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    getAllApis: async (req, res) => {
        try {
            const { skip = 0, limit = 10 } = req.query;

            const apis = await ApiMaster.find({})
                .sort({ createdAt: -1 })
                .limit(limit)
                .skip(limit * skip)
                .lean();
            const totalApis = await ApiMaster.count();

            res.status(200).json({
                apis,
                totalApis,
                skip: Number(skip),
                limit: Number(limit),
            });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    getSingleApi: async (req, res) => {
        try {
            const { apiId } = req.params;

            if (!isValidObjectId(apiId)) {
                return sendErrorResponse(res, 400, "invalid api id");
            }

            const api = await ApiMaster.findById(apiId);
            if (!api) {
                return sendErrorResponse(res, 400, "api not found");
            }

            res.status(200).json(api);
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },
};
