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

blogCategorySchema.virtual("totalBlogs", {
    ref: "Blog",
    localField: "_id",
    foreignField: "category",
    count: true,
});

const BlogCategory = model("BlogCategory", blogCategorySchema);

module.exports = BlogCategory;
