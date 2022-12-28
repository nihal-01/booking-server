const { sendErrorResponse } = require("../helpers");
const { Blog, BlogCategory } = require("../models");

module.exports = {
    getAllBlogs: async (req, res) => {
        try {
            const { skip = 0, limit = 10, category, tag } = req.query;

            const filters = {};

            if (category && category !== "") {
                if (!isValidObjectId(category)) {
                    return sendErrorResponse(res, 400, "Invalid category id");
                }

                filters.category = category;
            }

            if (tag && tag !== "") {
                filters.tags = tag;
            }

            const blogs = await Blog.find(filters)
                .populate("category")
                .sort({ createdAt: -1 })
                .limit(limit)
                .skip(limit * skip)
                .lean();

            const totalBlogs = await Blog.find(filters).count();

            res.status(200).json({
                blogs,
                totalBlogs,
                skip: Number(skip),
                limit: Number(limit),
            });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    getBlogsCategoriesAndTags: async (req, res) => {
        try {
            const categories = await BlogCategory.find({})
                .populate("totalBlogs")
                .lean();

            const tags = await Blog.aggregate([
                { $match: {} },
                { $unwind: "$tags" },
                {
                    $group: {
                        _id: "$tags",
                        totalBlogs: { $sum: 1 },
                    },
                },
                { $limit: 10 },
            ]);

            res.status(200).json({ categories, tags });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },
};
