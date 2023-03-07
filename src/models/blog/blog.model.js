const mongoose = require("mongoose");
const slug = require("mongoose-slug-generator");
const { Schema, model } = mongoose;

mongoose.plugin(slug);

const blogSchema = new Schema(
    {
        title: {
            type: String,
            required: true,
        },
        slug: {
            type: String,
            slug: ["title"],
            unique: true,
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
