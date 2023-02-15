const { isValidObjectId } = require("mongoose");
const {
  Reseller,
  B2BSpecialVisaMarkup,
  B2BSpecialAttractionMarkup,
} = require("../../b2b/models");

const { sendErrorResponse } = require("../../helpers");
const {
  b2bSpecialMarkupSchema,
} = require("../validations/b2bSpecialMarkupSchema");

module.exports = {
  upsertB2bAttractionMarkup: async (req, res) => {
    try {
      const { markupType, markup, resellerId } = req.body;

      const { _, error } = b2bSpecialMarkupSchema.validate(req.body);
      if (error) {
        return sendErrorResponse(res, 400, error.details[0].message);
      }

      if (!isValidObjectId(resellerId)) {
        return sendErrorResponse(res, 400, "Invalid reseller id");
      }

      const reseller = await Reseller.findOne({
        _id: resellerId,
        isDeleted: false,
      });
      if (!reseller) {
        return sendErrorResponse(res, 400, "Invalid reseller id");
      }

      console.log(reseller, "reseller");

      console.log(resellerId);

      const b2bAttractionSpecialMarkup =
        await B2BSpecialAttractionMarkup.findOneAndUpdate(
          {
            resellerId: reseller._id,
          },
          {
            markupType,
            markup,
          },
          { upsert: true, new: true }
        );

      // await Reseller.findByIdAndUpdate({
      //     resellerId
      // },
      // {specialMarkup: false },
      // { new: true, runValidators: true })

      console.log(b2bAttractionSpecialMarkup, "b2bAttractionSpecialMarkup");

      let tempObj = Object(b2bAttractionSpecialMarkup);
      tempObj.attraction = {
        _id: b2bAttractionSpecialMarkup?._id,
        markup: b2bAttractionSpecialMarkup?.markup,
        markupType: b2bAttractionSpecialMarkup?.markupType,
      };

      res.status(200).json(tempObj);
    } catch (err) {
      console.log(err, "error");
      sendErrorResponse(res, 500, err);
    }
  },

  listSpecialMarkup: async (req, res) => {
    try {
      const { resellerId } = req.params;
      console.log(resellerId);

      if (!isValidObjectId(resellerId)) {
        return sendErrorResponse(res, 400, "Invalid reseller id");
      }

      const attractionMarkup = await B2BSpecialAttractionMarkup.findOne({
        resellerId: resellerId,
      });
      if (!attractionMarkup) {
        return sendErrorResponse(res, 400, "No special markup found");
      }

      const visaMarkup = await B2BSpecialVisaMarkup.findOne({
        resellerId: resellerId,
      });
      if (!visaMarkup) {
        return sendErrorResponse(res, 400, "No special visa  markup found");
      }

      res
        .status(200)
        .json({ attractionMarkup: attractionMarkup, visaMarkup: visaMarkup });
    } catch (err) {
      console.log(err);
      sendErrorResponse(res, 500, err);
    }
  },

  upsertB2bVisaMarkup: async (req, res) => {
    try {
      const { markupType, markup, resellerId } = req.body;

      const { _, error } = b2bSpecialMarkupSchema.validate(req.body);
      if (error) {
        return sendErrorResponse(res, 400, error.details[0].message);
      }

      if (!isValidObjectId(resellerId)) {
        return sendErrorResponse(res, 400, "Invalid reseller id");
      }

      const reseller = await Reseller.findOne({
        _id: resellerId,
        isDeleted: false,
      });
      if (!reseller) {
        return sendErrorResponse(res, 400, "Invalid reseller id");
      }

      console.log(reseller, "reseller");

      console.log(resellerId);

      const b2bVisaSpecialMarkup = await B2BSpecialVisaMarkup.findOneAndUpdate(
        {
          resellerId: reseller._id,
        },
        {
          markupType,
          markup,
        },
        { upsert: true, new: true }
      );

      console.log(b2bVisaSpecialMarkup, "b2bAttractionSpecialMarkup");

      let tempObj = Object(b2bVisaSpecialMarkup);
      tempObj.visa = {
        _id: b2bVisaSpecialMarkup?._id,
        markup: b2bVisaSpecialMarkup?.markup,
        markupType: b2bVisaSpecialMarkup?.markupType,
      };

      res.status(200).json(tempObj);
    } catch (err) {
      console.log(err, "error");
      sendErrorResponse(res, 500, err);
    }
  },

  listVisaSpecialMarkup: async (req, res) => {
    try {
      const { resellerId } = req.params;
      console.log(resellerId);

      if (!isValidObjectId(resellerId)) {
        return sendErrorResponse(res, 400, "Invalid reseller id");
      }

      const markup = await B2BSpecialVisaMarkup.findOne({
        resellerId: resellerId,
      });
      if (!markup) {
        return sendErrorResponse(res, 400, "No special visa  markup found");
      }

      res.status(200).json(markup);
    } catch (err) {
      console.log(err);
      sendErrorResponse(res, 500, err);
    }
  },
};
