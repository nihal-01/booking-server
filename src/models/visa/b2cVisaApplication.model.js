const { Schema, model } = require("mongoose");

const b2cVisaApplicationSchema = new Schema(
  {
    visaType: {
      type: Schema.Types.ObjectId,
      ref: "VisaType",
      required: true,
    },
    visaPrice: {
      type: Number,
      required: true,
    },
    clientMarkup: {
      type: Number,
      required: true,
    },
    profit: {
      type: Number,
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
    },

    email: {
      type: String,
      required: true,
    },
    contactNo: {
      type: Number,
      required: true,
    },

    onwardDate: {
      type: Date,
      required: true,
    },

    returnDate: {
      type: Date,
      required: true,
    },
    noOfTravellers: {
      type: Number,
      required: true,
    },
    travellers: {
      type: [
        {
          title: {
            type: String,
            required: true,
            enum: ["mr", "ms", "mrs", "mstr"],
            lowercase: true,
          },
          firstName: {
            type: String,
            required: true,
          },
          lastName: {
            type: String,
            required: true,
          },
          expiryDate: {
            day: {
              type: Number,
              required: true,
            },
            month: {
              type: Number,
              required: true,
            },
            year: {
              type: Number,
              required: true,
            },
          },

          dateOfBirth: {
            day: {
              type: Number,
              required: true,
            },
            month: {
              type: Number,
              required: true,
            },
            year: {
              type: Number,
              required: true,
            },
          },
          country: {
            type: Schema.Types.ObjectId,
            ref: "Country",
            required: true,
          },
          passportNo: {
            type: String,
            required: true,
          },
          contactNo: {
            type: Number,
            required: true,
          },
          email: {
            type: String,
            required: true,
          },
          isStatus: {
            type: String,
            enum: ["initiated", "submitted", "approved", "rejected"],
            default: "initiated",
          },
          visaUpload: {
            type: String,
          },
          reason: {
            type: String,
          },

          documents: {
            type: Schema.Types.ObjectId,
            ref: "VisaDocument",
          },
        },
      ],
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    status: {
      type: String,
      required: true,
      lowercase: true,
      enum: ["initiated", "payed"],
      default: "initiated",
    },
    referenceNumber: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const B2cVisaApplicationSchema = model(
  "B2CVisaApplicationSchema",
  b2cVisaApplicationSchema
);

module.exports = B2cVisaApplicationSchema;
