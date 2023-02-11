const { isValidObjectId } = require("mongoose");
const { B2BTransaction, B2BWallet, Reseller } = require("../../b2b/models");

const { sendErrorResponse } = require("../../helpers");
const { Country, VisaType, Visa, VisaApplication, B2CVisaApplication } = require("../../models");
const sendVisaApplicationApproveEmail = require("../helpers/sendVisaApplicationApproveEmail");
const sendVisaApplicationRejectionEmail = require("../helpers/sendVisaApplicationCancelEmail");

module.exports= {

    listAllVisaApplication: async (req, res) => {
        try {
          const { skip = 0, limit = 10, status ,referenceNumber ,orderedBy } = req.query;
          
          let query = { };
          let filter2 

          console.log(orderedBy ,"orderedBy")
           

          if (referenceNumber && referenceNumber !== "") {
            query.referenceNumber = { $regex: referenceNumber, $options: "i" };
          }
          
          if (status && status !== "all") {
            filter2 = status;
          }

          if(orderedBy == "b2b"){
            query.orderedBy = "reseller"
          }else if (orderedBy == "subAgent"){
            query.orderedBy = "sub-agent"

          }

          console.log(query , "query")
          
          if(orderedBy == "b2c"){
            // const visaApplications = await B2CVisaApplication.find(query)
            // .populate({
            //   path: 'visaType',
            //   populate: {
            //     path: 'visa',
            //     populate : {
            //       path : 'country'
            //     }
  
            //   }
            // })
            //   .sort({
            //     createdAt: -1,
            //   })
            //   .limit(limit)
            //   .skip(limit * skip);

             const visaApplications = await B2CVisaApplication.aggregate([
              {
                $match: query
              },
              {
                $lookup: {
                  from: "users",
                  localField: "user",
                  foreignField: "_id",
                  as: "user",
                },
              },
              {
                $lookup: {
                  from: "visatypes",
                  localField: "visaType",
                  foreignField: "_id",
                  as: "visaType",
                },
              },
              {
                $lookup: {
                  from: "visas",
                  localField: "visaType.visa",
                  foreignField: "_id",
                  as: "visa",
                },
              },
              {
                $set: {
                  user : {$arrayElemAt: ["$user", 0] },
                  visaType: { $arrayElemAt: ["$visaType.visaName", 0] },
                  visa: { $arrayElemAt: ["$visa.name", 0] },
    
                },
              },
              {
                $unwind : "$travellers"
              },
              {
                $match: {
                  $expr: {
                    $eq: [
                      "$travellers.isStatus",
                      {
                        $ifNull: [filter2, "$travellers.isStatus"]
                      }
                    ]
                  }
                }
              },
              {
                $sort: {
                  createdAt: -1,
                }
              },
              {
                $group: {
                  _id: null,
                  count: { $sum: 1 },
                  visaApplications: { $push: "$$ROOT" }
                }
              },
              {
                $project: {
                  _id: 0,
                  count: 1,
                  visaApplications: {
                    $slice: [ "$visaApplications", Number(skip * limit), Number(limit) ]
                  }
                }
              }
            ]);
            
            if (!visaApplications) {
              return sendErrorResponse(res, 400, "VisaApplication Not Found ");
            }
      
           
            console.log(visaApplications[0]?.visaApplications , "visaApplications")      
            res.status(200).json({
              visaApplications : visaApplications[0]?.visaApplications,
              skip: Number(skip),
              limit: Number(limit),
              totalVisaApplications : visaApplications[0]?.count ,
            });
            }

          else{

            
            const visaApplications = await VisaApplication.aggregate([
              {
                $match: query
              },
              {
                $lookup: {
                  from: "resellers",
                  localField: "reseller",
                  foreignField: "_id",
                  as: "reseller",
                },
              },
              {
                $lookup: {
                  from: "visatypes",
                  localField: "visaType",
                  foreignField: "_id",
                  as: "visaType",
                },
              },
              {
                $lookup: {
                  from: "visas",
                  localField: "visaType.visa",
                  foreignField: "_id",
                  as: "visa",
                },
              },
              {
                $set: {
                  reseller : {$arrayElemAt: ["$reseller", 0] },
                  visaType: { $arrayElemAt: ["$visaType.visaName", 0] },
                  visa: { $arrayElemAt: ["$visa.name", 0] },
    
                },
              },
              {
                $unwind : "$travellers"
              },
              {
                $match: {
                  $expr: {
                    $eq: [
                      "$travellers.isStatus",
                      {
                        $ifNull: [filter2, "$travellers.isStatus"]
                      }
                    ]
                  }
                }
              },
              {
                $sort: {
                  createdAt: -1,
                }
              },
              {
                $group: {
                  _id: null,
                  count: { $sum: 1 },
                  visaApplications: { $push: "$$ROOT" }
                }
              },
              {
                $project: {
                  _id: 0,
                  count: 1,
                  visaApplications: {
                    $slice: [ "$visaApplications", Number(skip * limit), Number(limit) ]
                  }
                }
              }
            ]);

            console.log(visaApplications[0]?.visaApplications[0]  ,"visaApplications")
    
          if (!visaApplications) {
            return sendErrorResponse(res, 400, "VisaApplication Not Found ");
          }
    
    
          console.log(visaApplications , "visaApplications")      
          res.status(200).json({
            visaApplications : visaApplications[0].visaApplications,
            skip: Number(skip),
            limit: Number(limit),
            totalVisaApplications : visaApplications[0].count ,
          });
          }

          
          
        } catch (err) {
          console.log(err , "error")
          sendErrorResponse(res, 500, err);
        }
      },
    
      listSingleVisaApplication: async (req, res) => {
        try {
          const { id , orderedBy , travellerId} = req.params;
    
          if (!isValidObjectId(id)) {
            return sendErrorResponse(res, 400, "Invalid VisaApplication id");
          }
    
          let query = { _id: id };

          if(orderedBy == "b2b"){
            query.orderedBy = "reseller"
          }else if (orderedBy == "subAgent"){
            query.orderedBy = "sub-agent"

          }

          if(orderedBy == "b2c"){

            // const visaApplication = await B2CVisaApplication.findOne(query).populate(
            //   "user travellers.documents travellers.country"
            // ).populate({
            //   path: 'visaType',
            //   populate: {
            //     path: 'visa',
            //     populate : {
            //       path : 'country',
            //       select : "countryName"
            //     }
  
            //   }
            // })
            const visaApplication = await B2CVisaApplication.findOne(
              query,
              { travellers: { $elemMatch: { _id: travellerId } } }
          ).populate({
            path: 'visaType',
            populate: {
              path: 'visa',
              populate : {
                path : 'country',
                select : "countryName"
              }

            }
          }).populate("user referenceNumber createdAt totalAmount travellers.documents travellers.country")
      
            if (!visaApplication) {
              return sendErrorResponse(res, 400, "VisaApplication Not Found ");
            }
          
            res.status(200).json(visaApplication);
          }
             

          
          else{

         
            // const visaApplication = await VisaApplication.findOne(query).populate(
            //   "reseller travellers.documents travellers.country"
            // )

            const visaApplication = await VisaApplication.findOne(
              query,
              { travellers: { $elemMatch: { _id: travellerId } } }
          ).populate({
            path: 'visaType',
            populate: {
              path: 'visa',
              populate : {
                path : 'country',
                select : "countryName"
              }

            }
          }).populate("reseller referenceNumber createdAt totalAmount travellers.documents travellers.country")
      
            if (!visaApplication) {
              return sendErrorResponse(res, 400, "VisaApplication Not Found ");
            }
             

            console.log(visaApplication ,"visaApplication")
            res.status(200).json(visaApplication);
          
          }

        } catch (err) {

          console.log(err , "error")
          sendErrorResponse(res, 500, err);
        }
      },

      approveVisaApplicationStatus : async(req,res)=>{

        try{

          const {id} = req.params
          const {travellerId} = req.params
          const {orderedBy} = req.body
          

          let query = { _id: id };

          if(orderedBy == "b2b"){
            query.orderedBy = "reseller"
          }else if (orderedBy == "subAgent"){
            query.orderedBy = "sub-agent"

          }        


          if (!isValidObjectId(id)) {
            return sendErrorResponse(res, 400, "Invalid VisaApplication id");
          }
          

          console.log(req.file , "req.file?.path")
          let visa;
          if (req.file?.path) {
            visa = "/" + req.file.path.replace(/\\/g, "/");
          }         

          console.log(visa , "visa")
          

          if(!visa){
            return sendErrorResponse(res, 400, "Pdf Not Uploaded");

          }
         
          if (orderedBy  == "b2c"  ){

            
             

            console.log("call reached")
            const visaApplication = await B2CVisaApplication.findOne(query).populate(
              "user travellers.documents travellers.country"
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
            console.log(visaApplication , "visaApplication")
             
            if (!visaApplication) {
              return sendErrorResponse(res, 400, "VisaApplication Not Found Or Not Submitted");
            }
  
            if (!visaApplication.status == "payed") {
              return sendErrorResponse(res, 400, "VisaApplication Amount Not Payed ");
            }
            
           
  
            console.log(visa , "visaaa")
  
            let upload = await B2CVisaApplication.updateOne({  _id: id ,"travellers._id": travellerId }, 
            { $set: { "travellers.$.visaUpload": visa  , "travellers.$.isStatus" : "approved" }})
           
  

           
            const filteredTraveller = visaApplication.travellers.filter(traveller => {
              return traveller._id == travellerId;
          });
   
            sendVisaApplicationApproveEmail(visaApplication , filteredTraveller)
  
            
            await  visaApplication.save()
  
  
            res.status(200).json({status: true ,message : "Visa Uploaded Succesfully " })
          

           

          }else{
             
            
            console.log(query , "query")
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
  
            if (!visaApplication.status == "payed") {
              return sendErrorResponse(res, 400, "VisaApplication Amount Payed ");
            }
            
           
  
            console.log(visa , "visaaa")
  
            let upload = await VisaApplication.updateOne({  _id: id ,   "travellers._id": travellerId }, 
            { $set: { "travellers.$.visaUpload": visa  , "travellers.$.isStatus" : "approved" }})
           
  
            console.log(upload ,"upload")
  
            
  
            let reseller = await Reseller.findById(visaApplication.reseller).populate("referredBy")
  
  
            if(reseller.role == "subAgent" && visaApplication.subAgentMarkup > 0){
                 
              const transaction = new B2BTransaction({
                reseller: reseller?.referredBy,
                transactionType: "markup",
                status: "success",
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
            
            if( visaApplication.resellerMarkup > 0 ){
  
              const transaction = new B2BTransaction({
                reseller: reseller?._id,
                transactionType: "markup",
                status: "success",
                paymentProcessor: "wallet",
                amount: visaApplication.resellerMarkup / visaApplication.noOfTravellers ,
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
    
              console.log(wallet , "wallet")
              transaction.status = "success"
              await transaction.save()
  
            }
           
            
  
            const filteredTraveller = visaApplication.travellers.filter(traveller => {
              return traveller._id == travellerId;
          });
  
          console.log(filteredTraveller , "filteredTraveller")
          console.log(visaApplication , "visaApplication")
  
  
  
            sendVisaApplicationApproveEmail(visaApplication , filteredTraveller)
  
          
  
  
            await  visaApplication.save()
  
  
  
  
            res.status(200).json({status: true ,message : "Visa Uploaded Succesfully " })

        }
         

        }catch(err){
           
          console.log(err , "error")
          sendErrorResponse(res, 500, err);

        }
      },

      cancelVisaApplicationStatus : async(req,res)=>{

        try{
           
          const {id} = req.params
          const {travellerId} = req.params
          const {reason , orderedBy} = req.body

          console.log(reason , "reasons")



          if (!isValidObjectId(id)) {
            return sendErrorResponse(res, 400, "Invalid VisaApplication id");
          }

          if (orderedBy == 'b2b'){
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
            return sendErrorResponse(res, 400, "VisaApplication Not Found Or Not Submitted");
          }

          if (!visaApplication.status == "payed") {
            return sendErrorResponse(res, 400, "VisaApplication Amount Payed ");
          }
          
          
         

          let upload = await VisaApplication.updateOne({  _id: id ,  "travellers._id": travellerId }, 
          { $set: { "travellers.$.reason": reason  , "travellers.$.isStatus" : "rejected" } })
       
          console.log(upload)

          const filteredTraveller = visaApplication.travellers.filter(traveller => {
            return traveller._id == travellerId;
        });


          sendVisaApplicationRejectionEmail(visaApplication , filteredTraveller , reason)

          res.json({message : "Visa Rejectd Due To Some Reason"})

          }else{

            let query = { _id: id };

          const visaApplication = await B2CVisaApplication.findOne(query).populate(
            "user travellers.documents travellers.country"
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

          if (!visaApplication.status == "payed") {
            return sendErrorResponse(res, 400, "VisaApplication Amount Payed ");
          }
          
          
         

          let upload = await VisaApplication.updateOne({  _id: id ,  "travellers._id": travellerId }, 
          { $set: { "travellers.$.reason": reason  , "travellers.$.isStatus" : "rejected"} })
       
          console.log(upload)

          const filteredTraveller = visaApplication.travellers.filter(traveller => {
            return traveller._id == travellerId;
        });


          sendVisaApplicationRejectionEmail(visaApplication , filteredTraveller , reason)

          res.json({message : "Visa Rejectd Due To Some Reason"})
          }

          


        }catch(err){
           
          sendErrorResponse(res, 500, err);

        }
      }
}