const { isValidObjectId } = require("mongoose");
const { B2BTransaction, B2BWallet, Reseller } = require("../../b2b/models");

const { sendErrorResponse } = require("../../helpers");
const { Country, VisaType, Visa, VisaApplication } = require("../../models");
const sendVisaApplicationApproveEmail = require("../helpers/sendVisaApplicationApproveEmail");

module.exports= {

    listAllVisaApplication: async (req, res) => {
        try {
          const { skip = 0, limit = 10, status ,referenceNumber } = req.query;
          
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
            return sendErrorResponse(res, 400, "VisaApplication Not Found ");
          }
    
          res.status(200).json(visaApplication);


        } catch (err) {
          sendErrorResponse(res, 500, err);
        }
      },

      approveVisaApplicationStatus : async(req,res)=>{

        try{

          const {id} = req.params
          const {travellerId} = req.params



          if (!isValidObjectId(id)) {
            return sendErrorResponse(res, 400, "Invalid VisaApplication id");
          }

          let visa;
          if (req.file?.path) {
            visa = "/" + req.file.path.replace(/\\/g, "/");
          }          

          let query = { _id: id , status : "submitted" };

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
            return sendErrorResponse(res, 400, "VisaApplication Not Found Or Not Submitted");
          }

          if (visaApplication.isPayed == false) {
            return sendErrorResponse(res, 400, "VisaApplication Amount Payed ");
          }
          
          if(visaApplication.status == "approved"){
            return sendErrorResponse(res, 400, "VisaApplication Already Approved");

          }

          let upload = await VisaApplication.updateOne({  _id: id , status : "submitted" ,  "travellers._id": travellerId }, 
          { $set: { "travellers.$.visaUpload": visa } })


        

          let reseller = await Reseller.findById(visaApplication.reseller).populate("referredBy")


          if(reseller.role == "subAgent"){
               
            const transaction = new B2BTransaction({
              reseller: reseller?.referredBy,
              transactionType: "markup",
              status: "pending",
              paymentProcessor: "wallet",
              amount: visaApplication.subAgentMarkup / visaApplication.noOfTravellers,
              order: visaApplication._id,
              orderItem: visaApplication.visaType,
            });

           
            let wallet = await B2BWallet.updateOne({
              reseller: reseller?.referredBy,
            },
            {
              $inc: {
                balance: visaApplication.subAgentMarkup
              }
            },
            {
              upsert: true
            });

            transaction.status = "success"

           await transaction.save()


          }
          

          const transaction = new B2BTransaction({
            reseller: reseller?._id,
            transactionType: "markup",
            status: "pending",
            paymentProcessor: "wallet",
            amount: visaApplication.subAgentMarkup / visaApplication.noOfTravellers ,
            order: visaApplication._id,
            orderItem: visaApplication.visaType
                    });

         
          let wallet = await B2BWallet.updateOne({
            reseller: reseller?._id,
          },
          {
            $inc: {
              balance: visaApplication.resellerMarkup
            }
          },
          {
            upsert: true
          });
          

          const filteredTraveller = visaApplication.travellers.filter(traveller => {
            return traveller._id == travellerId;
        });


          sendVisaApplicationApproveEmail(visaApplication , filteredTraveller)

          transaction.status = "success"
         await transaction.save()


          await  visaApplication.save()




          res.status(200).json({message : "Visa Uploaded Succesfully " })

        }catch(err){
           
          console.log(err , "error")
          sendErrorResponse(res, 500, err);

        }
      },

      cancelVisaApplicationStatus : async(req,res)=>{

        try{
           
          const {id} = req.params
          const {travellerId , reason} = req.body



          if (!isValidObjectId(id)) {
            return sendErrorResponse(res, 400, "Invalid VisaApplication id");
          }

          let visa;
          if (req.file?.path) {
            visa = "/" + req.file.path.replace(/\\/g, "/");
          }          

          let query = { _id: id , status : "submitted" };

          const visaApplication = await VisaApplication.findOne(query)

           
          if (!visaApplication) {
            return sendErrorResponse(res, 400, "VisaApplication Not Found Or Not Submitted");
          }

          if (visaApplication.isPayed == false) {
            return sendErrorResponse(res, 400, "VisaApplication Amount Payed ");
          }
          
         

          let upload = await VisaApplication.updateOne({  _id: id , status : "submitted" ,  "travellers._id": travellerId }, 
          { $set: { "travellers.$.reason": reason } })
       
          

          res.json({message : "Visa Rejectd Due To Some Reason"})


        }catch(err){

          sendErrorResponse(res, 500, err);

        }
      }
}