const { isValidObjectId } = require("mongoose");
const { sendErrorResponse } = require("../../helpers");
const { Blog, BlogCategory } = require("../../models");
const { blogSchema } = require("../validations/blog.schema");

module.exports = {
    addBlog: async (req, res) => {
        try {
            const { title, body, category, tags } = req.body;

            const { _, error } = blogSchema.validate(req.body);
            if (error) {
                return sendErrorResponse(res, 400, error.details[0].message);
            }

            if (!isValidObjectId(category)) {
                return sendErrorResponse(res, 400, "Invalid category Id");
            }

            const blogCategory = await BlogCategory.findById(category);
            if (!blogCategory) {
                return sendErrorResponse(res, 404, "Category not found!");
            }

            if (!req.file?.path) {
                return sendErrorResponse(res, 400, "Thumbnail is required");
            }

            let thumbnailImg;
            if (req.file?.path) {
                thumbnailImg = "/" + req.file.path.replace(/\\/g, "/");
            }

            let parsedTags = [];
            if (tags) {
                parsedTags = JSON.parse(tags);
            }

            const newBlog = new Blog({
                title,
                body,
                category,
                tags: parsedTags,
                thumbnail: thumbnailImg,
            });
            await newBlog.save();

            res.status(200).json(newBlog);
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    deleteBlog: async (req, res) => {
        try {
            const { id } = req.params;

            if (!isValidObjectId(id)) {
                return sendErrorResponse(res, 400, "Invalid category Id");
            }

            const blog = await Blog.findByIdAndDelete(id);
            if (!blog) {
                return sendErrorResponse(res, 404, "Blog not found!");
            }

            res.status(200).json({
                message: "Blog successfully deleted",
                _id: id,
            });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    updateBlog: async (req, res) => {
        try {
            const { id } = req.params;
            const { title, body, category, tags } = req.body;

            const { _, error } = blogSchema.validate(req.body);
            if (error) {
                return sendErrorResponse(res, 400, error.details[0].message);
            }

            if (!isValidObjectId(id)) {
                return sendErrorResponse(res, 400, "Invalid Blog Id!");
            }

            if (category) {
                if (!isValidObjectId(category)) {
                    return sendErrorResponse(res, 400, "Invalid category Id");
                }

                const blogCategory = await BlogCategory.findById(category);
                if (!blogCategory) {
                    return sendErrorResponse(res, 404, "Category not found!");
                }
            }

            let thumbnailImg;
            if (req.file?.path) {
                thumbnailImg = "/" + req.file.path.replace(/\\/g, "/");
            }

            let parsedTags = [];
            if (tags) {
                parsedTags = JSON.parse(tags);
            }

            const blog = await Blog.findByIdAndUpdate(
                id,
                {
                    title,
                    body,
                    category,
                    tags: parsedTags,
                    thumbnail: thumbnailImg,
                },
                { runValidators: true, new: true }
            );
            if (!blog) {
                return sendErrorResponse(res, 404, "Blog not found!");
            }

            res.status(200).json(blog);
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

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
};
