const { isValidObjectId } = require("mongoose");

const { sendErrorResponse } = require("../../helpers");
const { Country, VisaType, Visa, VisaApplication } = require("../../models");

module.exports= {

    listAllVisaApplication: async (req, res) => {
        try {
          const { skip = 0, limit = 10, status ,referenceNumber } = req.query;
          
          console.log("hiiii")
          let query = { };
           

          if (referenceNumber && referenceNumber !== "") {
            query.referenceNumber = { $regex: referenceNumber, $options: "i" };
          }
          
          if (status && status !== "all") {
            query.status = status;
          }
    
          const visaApplications = await VisaApplication.find(query)
          .populate({
            path: 'visaType',
            populate: {
              path: 'visa',
              populate : {
                path : 'country'
              }

            }
          })
            .sort({
              createdAt: -1,
            })
            .limit(limit)
            .skip(limit * skip);
    
          if (!visaApplications) {
            return sendErrorResponse(res, 400, "VisaApplication Not Found ");
          }
    
    
          const totalVisaApplications = await VisaApplication.find(query).count();
    
          res.status(200).json({
            visaApplications,
            skip: Number(skip),
            limit: Number(limit),
            totalVisaApplications,
          });
        } catch (err) {
          sendErrorResponse(res, 500, err);
        }
      },
    
      listSingleVisaApplication: async (req, res) => {
        try {
          const { id } = req.params;
    
          if (!isValidObjectId(id)) {
            return sendErrorResponse(res, 400, "Invalid VisaApplication id");
          }
    
          let query = { _id: id };
    
          const visaApplication = await VisaApplication.findOne(query).populate(
            "reseller documents"
          );
    
          if (!visaApplication) {
            return sendErrorResponse(res, 400, "VisaApplication Not Found ");
          }
    
          res.status(200).json(visaApplication);
        } catch (error) {
          sendErrorResponse(res, 500, err);
        }
      },
}