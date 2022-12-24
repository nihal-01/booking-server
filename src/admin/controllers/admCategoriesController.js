const { isValidObjectId } = require("mongoose");

const { sendErrorResponse } = require("../../helpers");
const { Category } = require("../../model");

module.exports = {
    createCategory: async (req, res) => {
        try {
            const { categoryName, description } = req.body;

            if (!categoryName) {
                return sendErrorResponse(res, 400, "CategoryName is required");
            }

            const newCategory = new Category({
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
            const categories = await Category.find({});
            res.status(200).json(categories);
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

            const category = await Category.findByIdAndRemove(id);
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

            const category = await Category.findByIdAndUpdate(
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
