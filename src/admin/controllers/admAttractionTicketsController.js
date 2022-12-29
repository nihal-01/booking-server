const fs = require("fs");
const { parse } = require("csv-parse");

const { sendErrorResponse } = require("../../helpers");
const { AttractionTicket, AttractionActivity } = require("../../models");
const { isValidObjectId } = require("mongoose");
const {
    attractionTicketUploadSchema,
} = require("../validations/attraction.schema");

module.exports = {
    uploadTicket: async (req, res) => {
        try {
            const { activity } = req.body;

            const { _, error } = attractionTicketUploadSchema.validate(
                req.body
            );
            if (error) {
                return sendErrorResponse(res, 400, error.details[0].message);
            }

            if (!isValidObjectId(activity)) {
                return sendErrorResponse(res, 400, "Invalid activity id");
            }

            const activityDetails = await AttractionActivity.findById(
                activity
            ).populate("attraction");
            if (!activityDetails) {
                return sendErrorResponse(res, 400, "Activity not found");
            }

            if (!activityDetails?.attraction) {
                return sendErrorResponse(
                    res,
                    400,
                    "Attraction not found or disabled"
                );
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

            let ticketsList = [];
            let csvRow = 0;

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
                        });
                    }
                    csvRow += 1;
                })
                .on("end", async function () {
                    for (let i = 0; i < ticketsList.length; i++) {
                        await AttractionTicket.findOneAndUpdate(
                            {
                                ticketNo:
                                    ticketsList[i]?.ticketNo?.toUpperCase(),
                            },
                            {
                                lotNo: ticketsList[i]?.lotNo,
                                activity: ticketsList[i]?.activity,
                                validity: ticketsList[i]?.validity,
                                validTill: ticketsList[i]?.validTill,
                                details: ticketsList[i]?.details,
                                ticketFor: ticketsList[i]?.ticketFor,
                            },
                            { upsert: true, runValidators: true }
                        );
                    }

                    res.status(200).json({
                        message: "Tickets successfully uploaded",
                    });
                })
                .on("error", function (err) {
                    sendErrorResponse(
                        res,
                        400,
                        "Something went wrong, Wile parsing CSV"
                    );
                });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },
};
