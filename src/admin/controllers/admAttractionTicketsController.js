const fs = require("fs");
const { parse } = require("csv-parse");

const { sendErrorResponse } = require("../../helpers");
const { AttractionTicket } = require("../../models");
const { isValidObjectId } = require("mongoose");

module.exports = {
    uploadTicket: async (req, res) => {
        try {
            const { activity } = req.body;

            if (!isValidObjectId(activity)) {
                return sendErrorResponse(res, 400, "Invalid activity id");
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
