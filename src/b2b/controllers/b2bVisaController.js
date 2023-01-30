const { isValidObjectId, Types } = require("mongoose");
const { sendErrorResponse } = require("../../helpers");
const { VisaType } = require("../../models");

module.exports = {
  getSingleVisa: async (req, res) => {
    try {
      const { id } = req.params;

      if (!isValidObjectId(id)) {
        return sendErrorResponse(res, 400, "Invalid VisaType id");
      }

      if (req.reseller.role == "reseller") {
        const visaType = await VisaType.aggregate([
          {
            $match: {
              _id: Types.ObjectId(id),
              isDeleted: false,
            },
          },
          {
            $lookup: {
              from: "visas",
              localField: "visa",
              foreignField: "_id",
              as: "visa",
            },
          },
          {
            $lookup: {
              from: "b2bclientvisamarkups",
              let: {
                visaType: "$_id",
              },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ["$resellerId", req.reseller._id] },
                        { $eq: ["$visaType", "$$visaType"] },
                      ],
                    },
                  },
                },
              ],
              as: "markupClient",
            },
          },

          {
            $set: {
              markupClient: { $arrayElemAt: ["$markupClient", 0] },
            },
          },
          {
            $addFields: {
              totalPrice: {
                $cond: [
                  {
                    $eq: ["$markupClient.markupType", "percentage"],
                  },

                  {
                    $sum: [
                      "$visaPrice",
                      {
                        $divide: [
                          {
                            $multiply: ["$markupClient.markup", "$visaPrice"],
                          },
                          100,
                        ],
                      },
                    ],
                  },

                  {
                    $sum: ["$visaPrice", "$markupClient.markup"],
                  },
                ],
              },
            },
          },
        ]);

        console.log(visaType, "visaType");

        res.status(200).json(visaType);
      }else{

        const visaType = await VisaType.aggregate([
            {
              $match: {
                _id: Types.ObjectId(id),
                isDeleted: false,
              },
            },
            {
              $lookup: {
                from: "visas",
                localField: "visa",
                foreignField: "_id",
                as: "visa",
              },
            },
            {
              $lookup: {
                from: "b2bclientvisamarkups",
                let: {
                  visaType: "$_id",
                },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ["$resellerId", req.reseller._id] },
                          { $eq: ["$visaType", "$$visaType"] },
                        ],
                      },
                    },
                  },
                ],
                as: "markupClient",
              },
            },
  
            {
              $set: {
                markupClient: { $arrayElemAt: ["$markupClient", 0] },
              },
            },
            {
              $addFields: {
                totalPrice: {
                  $cond: [
                    {
                      $eq: ["$markupClient.markupType", "percentage"],
                    },
  
                    {
                      $sum: [
                        "$visaPrice",
                        {
                          $divide: [
                            {
                              $multiply: ["$markupClient.markup", "$visaPrice"],
                            },
                            100,
                          ],
                        },
                      ],
                    },
  
                    {
                      $sum: ["$visaPrice", "$markupClient.markup"],
                    },
                  ],
                },
              },
            },
          ]);
  
          console.log(visaType, "visaType");
  
          res.status(200).json(visaType);

      }
    } catch (err) {
      sendErrorResponse(res, 500, err);
    }
  },
};
