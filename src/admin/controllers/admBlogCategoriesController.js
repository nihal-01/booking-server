const { isValidObjectId } = require("mongoose");

const { sendErrorResponse } = require("../../helpers");
const { BlogCategory } = require("../../models");
const { blogCategorySchema } = require("../validations/category.schema");

module.exports = {
    addCategory: async (req, res) => {
        try {
            const { categoryName, description } = req.body;

            const { _, error } = blogCategorySchema.validate(req.body);
            if (error) {
                return sendErrorResponse(res, 400, error.details[0].message);
            }

            const newCategory = new BlogCategory({
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

            const categories = await BlogCategory.find({})
                .sort({ createdAt: -1 })
                .limit(limit)
                .skip(limit * skip);

            const totalCategories = await BlogCategory.find({}).count();

            res.status(200).json({
                categories,
                totalCategories,
                skip: Number(skip),
                limit: Number(limit),
            });
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

            const category = await BlogCategory.findByIdAndRemove(id);
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

            const category = await BlogCategory.findByIdAndUpdate(
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
