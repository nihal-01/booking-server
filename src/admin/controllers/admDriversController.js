const { isValidObjectId } = require("mongoose");
const { sendErrorResponse } = require("../../helpers");
const { Driver } = require("../../models");

module.exports = {
    addNewDriver: async (req, res) => {
        try {
            const { driverName, phoneNumber } = req.body;

            const newDriver = new Driver({
                driverName,
                phoneNumber,
            });
            await newDriver.save();

            res.status(200).json(newDriver);
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    deleteDriver: async (req, res) => {
        try {
            const { id } = req.params;

            if (!isValidObjectId(id)) {
                return sendErrorResponse(res, 400, "Invalid driver id");
            }

            const driver = await Driver.findOneAndUpdate(
                {
                    _id: id,
                    isDeleted: false,
                },
                { isDeleted: true }
            );

            if (!driver) {
                return sendErrorResponse(res, 404, "Driver not found");
            }

            res.status(200).json({ message: "Driver successfully deleted" });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },
};
