const { sendErrorResponse } = require("../helpers");
const { AttractionCategory } = require("../models");

module.exports = {
    getAllCategories: async (req, res) => {
        try {
            const categories = await AttractionCategory.find({});
            res.status(200).json(categories);
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },
};
