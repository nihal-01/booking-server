const { isValidObjectId } = require("mongoose");
const { Reseller, B2BSpecialMarkup } = require("../../b2b/models");

const { sendErrorResponse } = require("../../helpers");
const {
  b2bSpecialMarkupSchema,
} = require("../validations/b2bSpecialMarkupSchema");

module.exports = {
  upsertB2bMarkup: async (req, res) => {
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
        await B2BSpecialMarkup.findOneAndUpdate(
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
        title: b2bAttractionSpecialMarkup?.markup,
        title: b2bAttractionSpecialMarkup?.markupType,
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

      const markup = await B2BSpecialMarkup.findOne({
        resellerId: resellerId,
      });
      if (!markup) {
        return sendErrorResponse(res, 400, "No special markup found");
      }
      console.log(markup);

      res.status(200).json(markup);
    } catch (err) {
      console.log(err);
      sendErrorResponse(res, 500, err);
    }
  },
};
