const { isValidObjectId } = require("mongoose");
const { sendErrorResponse } = require("../../helpers");
const { Hotel, RoomType } = require("../../models");
const { roomTypeSchema } = require("../validations/admRoomType.schema");

module.exports = {
    addNewRoomType: async (req, res) => {
        try {
            const { hotel } = req.body;

            const { _, error } = roomTypeSchema.validate(req.body);
            if (error) {
                return sendErrorResponse(res, 400, error.details[0].message);
            }

            if (!isValidObjectId(hotel)) {
                return sendErrorResponse(res, 400, "invalid hotel id");
            }

            const hotelDetails = await Hotel.findOne({
                _id: hotel,
                isDeleted: false,
                isPublished: true,
            });
            if (!hotelDetails) {
                return sendErrorResponse(res, 404, "hotel details not found");
            }

            let images = [];
            for (let i = 0; i < req.files?.length; i++) {
                const img = "/" + req.files[i]?.path?.replace(/\\/g, "/");
                images.push(img);
            }

            const newRoomType = new RoomType({
                ...req.body,
                images,
            });
            await newRoomType.save();

            res.status(200).json({
                message: "room type successfully added",
                _id: newRoomType?._id,
            });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    updateRoomType: async (req, res) => {
        try {
            const { hotel, oldImages } = req.body;
            const { roomTypeId } = req.params;

            const { _, error } = roomTypeSchema.validate(req.body);
            if (error) {
                return sendErrorResponse(res, 400, error.details[0].message);
            }

            if (!isValidObjectId(hotel)) {
                return sendErrorResponse(res, 400, "invalid hotel id");
            }

            const hotelDetails = await Hotel.findOne({
                _id: hotel,
                isDeleted: false,
                isPublished: true,
            });
            if (!hotelDetails) {
                return sendErrorResponse(res, 404, "hotel details not found");
            }

            if (!isValidObjectId(roomTypeId)) {
                return sendErrorResponse(res, 400, "invalid room type id");
            }

            let parsedOldImages = [];
            if (oldImages) {
                parsedOldImages = JSON.parse(oldImages);
            }

            let newImages = [...parsedOldImages];
            for (let i = 0; i < req.files?.length; i++) {
                const img = "/" + req.files[i]?.path?.replace(/\\/g, "/");
                newImages.push(img);
            }

            const roomType = await RoomType.findOneAndUpdate(
                {
                    isDeleted: false,
                    _id: roomTypeId,
                },
                {
                    ...req.body,
                    images: newImages,
                },
                { runValidators: true }
            );

            if (!roomType) {
                return sendErrorResponse(res, 404, "room type not found");
            }

            res.status(200).json({
                message: "room type successfully updated",
                _id: roomTypeId,
            });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    deleteRoomType: async (req, res) => {
        try {
            const { roomTypeId } = req.params;

            if (!isValidObjectId(roomTypeId)) {
                return sendErrorResponse(res, 400, "invalid room type id");
            }

            const roomType = await RoomType.findOneAndUpdate(
                {
                    _id: roomTypeId,
                    isDeleted: false,
                },
                { isDeleted: true }
            );
            if (!roomType) {
                return sendErrorResponse(res, 404, "room type not found");
            }

            res.status(200).json({
                message: "room type successfully deleted",
                _id: roomTypeId,
            });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    getSingleHotelRoomTypes: async (req, res) => {
        try {
            const { hotelId } = req.params;

            if (!isValidObjectId(hotelId)) {
                return sendErrorResponse(res, 400, "invalid hotel id");
            }

            const hotel = await Hotel.findOne({
                _id: hotelId,
                isDeleted: false,
            }).select("name");
            if (!hotel) {
                return sendErrorResponse(res, 404, "hotel not found");
            }

            const roomTypes = await RoomType.find({
                isDeleted: false,
                hotel: hotelId,
            }).sort({ createdAt: -1 });

            res.status(200).json({ hotel, roomTypes });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },
};
