const { isValidObjectId } = require("mongoose");

const { sendErrorResponse } = require("../../helpers");
const { AttractionCategory } = require("../../models");

module.exports = {
    addCategory: async (req, res) => {
        try {
            const { categoryName, description } = req.body;

            if (!categoryName) {
                return sendErrorResponse(res, 400, "CategoryName is required");
            }

            const newCategory = new AttractionCategory({
                categoryName,
                description,
            });
            await newCategory.save();

            res.status(200).json(newCategory);
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    getAllCategories: async (req, res) => {
        try {
            const { skip = 0, limit = 10 } = req.query;

            const categories = await AttractionCategory.find({})
                .sort({ createdAt: -1 })
                .limit(limit)
                .skip(limit * skip);

            const totalCategories = await AttractionCategory.find({}).count();

            res.status(200).json({ categories, totalCategories, skip, limit });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    deleteCategory: async (req, res) => {
        try {
            const { id } = req.params;

            if (!isValidObjectId(id)) {
                return sendErrorResponse(res, 400, "Invalid category id!");
            }

            const category = await AttractionCategory.findByIdAndRemove(id);
            if (!category) {
                return sendErrorResponse(res, 404, "Category not found!");
            }

            res.status(200).json({
                message: "Category successfully deleted",
                _id: id,
            });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    updateCategory: async (req, res) => {
        try {
            const { id } = req.params;
            const { categoryName, description } = req.body;

            if (!isValidObjectId(id)) {
                return sendErrorResponse(res, 400, "Invalid category id!");
            }

            const category = await AttractionCategory.findByIdAndUpdate(
                id,
                {
                    categoryName,
                    description,
                },
                { runValidators: true, new: true }
            );

            if (!category) {
                return sendErrorResponse(res, 404, "Category not found!");
            }

            res.status(200).json(category);
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },
};
