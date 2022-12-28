const mongoose = require("mongoose");
const slug = require("mongoose-slug-generator");

const { Schema, model } = mongoose;

mongoose.plugin(slug);

const blogCategorySchema = new Schema(
    {
        categoryName: {
            type: String,
            required: true,
            lowercase: true,
        },
        slug: {
            type: String,
            slug: ["categoryName"],
            unique: true,
        },
        description: {
            type: String,
        },
    },
    { timestamps: true }
);

const BlogCategory = model("BlogCategory", blogCategorySchema);

module.exports = BlogCategory;
