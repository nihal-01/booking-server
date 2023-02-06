const { sendErrorResponse } = require("../../helpers");
const { VisaApplication } = require("../../models");


module.exports = {

    getB2BAllVisaApplication: async (req, res) => {
        try {
            const { skip = 0, limit = 10, status } = req.query;

            let query = { reseller: req.reseller._id };

            if (status && status !== "all") {
                query.status = status;
            }

            const visaApplication = await VisaApplication.find(query)
                .sort({
                    createdAt: -1,
                })
                .limit(limit)
                .skip(limit * skip);

                if (!visaApplication) {
                    return sendErrorResponse(res, 400, "No Visa Application Available");
                  }

            const totalVisaApplication = await VisaApplication.find(query).count();

            res.status(200).json({
                visaApplication,
                skip: Number(skip),
                limit: Number(limit),
                totalVisaApplication,
            });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },


    getB2BSingleVisaApplication : async(req,res)=>{

        try{

            const {id} = req.params

            let query = { _id : id , reseller: req.reseller._id };

            const visaApplication = await VisaApplication.findOne(query).populate(
                "reseller travellers.documents travellers.country"
              ).populate({
                path: 'visaType',
                populate: {
                  path: 'visa',
                  populate : {
                    path : 'country',
                    select : "countryName"
                  }
    
                }
              })

              if (!visaApplication) {
                return sendErrorResponse(res, 400, "No Visa Application Available");
              }


              res.status(200).json(visaApplication)

        }catch(err){

            sendErrorResponse(res, 500, err);


        }
    }
}