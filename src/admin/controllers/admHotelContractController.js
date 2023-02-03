const { isValidObjectId } = require("mongoose");

const { sendErrorResponse } = require("../../helpers");
const { RoomType, HotelContract } = require("../../models");
const getDates = require("../../utils/getDates");
const {
    hotelContractSchema,
} = require("../validations/admHotelContract.schema");

module.exports = {
    updateHotelContract: async (req, res) => {
        try {
            const {
                dateFrom,
                dateTo,
                roomType,
                price,
                contractType,
                isNewUpdate,
            } = req.body;

            const { _, error } = hotelContractSchema.validate(req.body);
            if (error) {
                return sendErrorResponse(res, 400, error.details[0].message);
            }

            if (!isValidObjectId(roomType)) {
                return sendErrorResponse(res, 400, "invalid room type id");
            }

            const roomTypeDetails = await RoomType.findOne({
                _id: roomType,
                isDeleted: false,
            });
            if (!roomTypeDetails) {
                return sendErrorResponse(res, 400, "room type not found");
            }

            const dates = getDates(dateFrom, dateTo);
            for (let i = 0; i < dates.length; i++) {
                const newHotelContract = new HotelContract({
                    hotel: roomTypeDetails.hotel,
                    roomType,
                    date: dates[i],
                    price,
                    contractType,
                    isNewUpdate,
                });
                await newHotelContract.save();
            }

            res.status(200).json({ message: "contract successfully updated" });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    getHotelContracts: async (req, res) => {
        try {
        } catch (err) {
            sendErrorResponse(res, 400, err);
        }
    },
};
