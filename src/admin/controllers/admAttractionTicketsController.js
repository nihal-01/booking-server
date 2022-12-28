const fs = require("fs");
const { parse } = require("csv-parse");

const { sendErrorResponse } = require("../../helpers");

module.exports = {
    uploadTicket: async (req, res) => {
        try {
            if (!req.file) {
                return sendErrorResponse(res, 500, "CSV file is required");
            }

            var csvData = [];

            console.log(req.file);
            fs.createReadStream(req.file?.path)
                .pipe(parse({ delimiter: ":" }))
                .on("data", function (csvrow) {
                    console.log(csvrow);
                    //do something with csvrow
                    csvData.push(csvrow);
                })
                .on("end", function () {
                    //do something with csvData
                    console.log(csvData);
                });

            // sendErrorResponse(res, 500, err);
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },
};
