const fs = require("fs");
const { parse } = require("csv-parse");

const { sendErrorResponse, createQuotationPdf } = require("../../helpers");
const { AttractionTicket, AttractionActivity } = require("../../models");
const { isValidObjectId } = require("mongoose");
const {
  attractionTicketUploadSchema,
} = require("../validations/attraction.schema");

module.exports = {
  uploadTicket: async (req, res) => {
    try {
      const { activity } = req.body;

      const { _, error } = attractionTicketUploadSchema.validate(req.body);
      if (error) {
        return sendErrorResponse(res, 400, error.details[0].message);
      }

      if (!isValidObjectId(activity)) {
        return sendErrorResponse(res, 400, "Invalid activity id");
      }

      const activityDetails = await AttractionActivity.findOne({
        _id: activity,
        isDeleted: false,
      }).populate("attraction");
      if (!activityDetails) {
        return sendErrorResponse(res, 400, "Activity not found");
      }

      if (!activityDetails?.attraction) {
        return sendErrorResponse(res, 400, "Attraction not found or disabled");
      }

      if (activityDetails?.attraction?.bookingType !== "ticket") {
        return sendErrorResponse(
          res,
          400,
          "You can't upload ticket to type 'booking'"
        );
      }

      if (!req.file) {
        return sendErrorResponse(res, 500, "CSV file is required");
      }

      let csvRow = 0;
      let ticketsList = [];
      let newTickets = [];
      let errorTickets = [];
      const uploadTickets = async () => {
        for (let i = 0; i < ticketsList?.length; i++) {
          try {
            const ticket = await AttractionTicket.findOne({
              ticketNo: ticketsList[i]?.ticketNo?.toUpperCase(),
              activity,
            });
            if (!ticket) {
              const newTicket = new AttractionTicket({
                ticketNo: ticketsList[i]?.ticketNo,
                lotNo: ticketsList[i]?.lotNo,
                activity: ticketsList[i]?.activity,
                validity: ticketsList[i]?.validity,
                validTill: ticketsList[i]?.validTill,
                details: ticketsList[i]?.details,
                ticketFor: ticketsList[i]?.ticketFor,
                ticketCost: ticketsList[i]?.ticketCost,
              });
              await newTicket.save();
              newTickets.push(Object(newTicket));
            }
          } catch (err) {
            errorTickets.push(ticketsList[i]?.ticketNo);
          }
        }
      };

      fs.createReadStream(req.file?.path)
        .pipe(parse({ delimiter: "," }))
        .on("data", async function (csvrow) {
          if (csvRow !== 0) {
            ticketsList.push({
              ticketNo: csvrow[0],
              lotNo: csvrow[1],
              activity,
              validity: csvrow[2]?.toLowerCase() === "y",
              validTill: csvrow[3],
              details: csvrow[4],
              ticketFor: csvrow[5],
              ticketCost: csvrow[6],
            });
          }
          csvRow += 1;
        })
        .on("end", async function () {
          await uploadTickets();

          if (errorTickets?.length > 0) {
            return res.status(200).json({
              status: "error",
              message: `${errorTickets} not uploaded, please try with correct details`,
              newTickets,
            });
          }

          res.status(200).json({
            message: "Tickets successfully uploaded",
            status: "ok",
            newTickets,
          });
        })
        .on("error", function (err) {
          sendErrorResponse(res, 400, "Something went wrong, Wile parsing CSV");
        });
    } catch (err) {
      sendErrorResponse(res, 500, err);
    }
  },

  getSingleActivitiesTicket: async (req, res) => {
    try {
      const { activityId } = req.params;
      const { skip = 0, limit = 10 } = req.query;

      if (!isValidObjectId) {
        return sendErrorResponse(res, 400, "Invalid Activity Id");
      }

      const activity = await AttractionActivity.findOne({
        isDeleted: false,
        _id: activityId,
      })
        .populate("attraction", "bookingType")
        .select("name attraction");

      if (!activity) {
        return sendErrorResponse(res, 404, "Activity not found");
      }

      if (activity.attraction?.bookingType !== "ticket") {
        return sendErrorResponse(
          res,
          400,
          "This type `booking` has no tickets"
        );
      }

      const tickets = await AttractionTicket.find({
        activity: activityId,
      })
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(limit * skip);

      const totalTickets = await AttractionTicket.find({
        activity: activityId,
      }).count();

      res.status(200).json({
        tickets,
        totalTickets,
        limit: Number(limit),
        skip: Number(skip),
        activity,
      });
    } catch (err) {
      sendErrorResponse(res, 500, err);
    }
  },

  updateTicketStatus: async (req, res) => {
    try {
      const { id } = req.params;

      if (!isValidObjectId(id)) {
        return sendErrorResponse(res, 400, "Invalid Ticket Id");
      }


      const ticket = await AttractionTicket.findById(id);

      if(!ticket){
        return sendErrorResponse(res, 400, "Invalid Ticket Id");

      }

      if(ticket.status !== "ok"){
        return sendErrorResponse(res, 400, "Ticket Already Reserved Or Used");

      }

      if(ticket.validity ){

       if( new Date(ticket.validTill)  < new Date()){

         return sendErrorResponse(res, 400, "Ticket Date Experied");

       }

      }

      ticket.status = "used"

      await ticket.save()

      res.status(200).json({
        ticket,
      });


    } catch (error) {

      sendErrorResponse(res, 500, error);

    }
  },

  downloadTicket: async (req, res) => {
    try {
        
        const { id } = req.params;
  
        if (!isValidObjectId(id)) {
          return sendErrorResponse(res, 400, "Invalid Ticket Id");
        }

        let ticketData = await AttractionTicket.findById(id)

        createQuotationPdf(ticketData)
          
        if(!ticketData){
          
          sendErrorResponse(res, 400, "Ticket Not Found");

        }
        

        res.status(200).json({
          ticketData
        });
  
   


    } catch (error) {
      sendErrorResponse(res, 500, error);
    }
  },
};
