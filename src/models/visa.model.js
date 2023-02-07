const { Schema, model } = require("mongoose");

const visaSchema = new Schema(
    {
        country: {
            type: Schema.Types.ObjectId,
            ref: "Country",
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        // documents: {
        //     type: [
        //         {
        //             title: {
        //                 type: String,
        //                 required: true,
        //             },
        //             body: {
        //                 type: String,
        //                 required: true,
        //             },
        //         },
        //     ],
        // },
        inclusions: {
            type: [{ type: String, required: true }],
        },
        description: {
            type: String,
            required: true,
        },
        termsAndConditions: {
            type: String,
            required: true,
        },
        sampleVisa: {
            type: String,
            // required: true,
        },
        faqs: {
            type: [
                {
                    question: {
                        type: String,
                        required: true,
                    },
                    answer: {
                        type: String,
                        required: true,
                    },
                },
            ],
        },
        details: {
            type: [
                {
                    title: {
                        type: String,
                        required: true,
                    },
                    body: {
                        type: String,
                        required: true,
                    },
                },
            ],
        },
        // keywords: {
        //     type: [{ type: String, required: true, lowercase: true }],
        // },
         isDeleted: {
            type: Boolean,
            required: true,
            default: false,
        },
    },
    
    { timestamps: true }
);

const Visa = model("Visa", visaSchema);

module.exports = Visa;
