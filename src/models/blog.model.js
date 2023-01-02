const { Schema, model } = require("mongoose");

const blogSchema = new Schema(
    {
        title: {
            type: String,
            required: true,
        },
        body: {
            type: String,
            required: true,
        },
        thumbnail: {
            type: String,
            required: true,
        },
        category: {
            type: Schema.Types.ObjectId,
            ref: "BlogCategory",
            required: true,
        },
        tags: {
            type: [{ type: String, required: true, lowercase: true }],
        },
        isDeleted: {
            type: Boolean,
            required: false,
            default: false,
        },
    },
    { timestamps: true }
);

const Blog = model("Blog", blogSchema);

module.exports = Blog;
