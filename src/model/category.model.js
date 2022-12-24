const mongoose = require("mongoose");
const slug = require("mongoose-slug-generator");
const { Schema, model } = mongoose;

mongoose.plugin(slug);

const categorySchema = new Schema(
    {
        categoryName: {
            type: String,
            required: true,
        },
        slug: {
            type: String,
            slug: ["categoryName"],
            unique: true,
            required: true,
        },
        description: {
            type: String,
        },
    },
    { timestamps: true }
);

const Category = model("Category", categorySchema);

module.exports = Category;
