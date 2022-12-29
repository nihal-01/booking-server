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

            const activityDetails = await AttractionActivity.findById(activity);
            if (!activityDetails) {
                return sendErrorResponse(res, 400, "Activity not found");
            }

            if (!req.file) {
                return sendErrorResponse(res, 500, "CSV file is required");
            }

            var csvData = [];
            let rowNo = 0;

            // console.log(req.file);
            fs.createReadStream(req.file?.path)
                .pipe(parse({ delimiter: "," }))
                .on("data", function (csvrow) {
                    if (rowNo !== 0) {
                        const data = {
                            ticketNo: csvrow[0],
                            lotNo: csvrow[1],
                            activity: "csvrow[0]",
                            validity: csvrow[2]?.toLowerCase() === "y",
                            validTill: csvrow[3],
                            details: csvrow[4],
                            ticketFor: csvrow[5],
                        };
                        csvData.push(csvrow);
                    }
                    rowNo += 1;
                    //do something with csvrow
                })
                .on("end", function () {
                    //do something with csvData
                    // console.log(csvData);
                });

            // sendErrorResponse(res, 500, err);
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },
};
