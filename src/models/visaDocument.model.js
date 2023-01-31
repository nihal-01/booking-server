const { Schema, model } = require("mongoose");

const visaDocumentSchema = new Schema(
    {
        passportFistPagePhoto: {
            type: String,
            required: true,
        },
       
        passportLastPagePhoto: {
            type: String,
            required: true,
        },
        passportSizePhoto: {
            type: String,
            required: true,
        },
    },
    { timestamps: true }
);

const VisaDocument = model("VisaDocument", visaDocumentSchema);

module.exports = VisaDocument;
