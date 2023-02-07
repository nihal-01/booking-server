const { isValidObjectId } = require("mongoose");
const { sendErrorResponse } = require("../../helpers");
const { Hotel, RoomType } = require("../../models");
const { roomTypeSchema } = require("../validations/admRoomType.schema");

module.exports = {
    addNewRoomType: async (req, res) => {
        try {
            const { hotel, inclusions } = req.body;

            const { _, error } = roomTypeSchema.validate({
                ...req.body,
                inclusions: inclusions ? JSON.parse(inclusions) : [],
            });
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

            let parsedInclusions = [];
            if (inclusions) {
                parsedInclusions = JSON.parse(inclusions);
            }

            const newRoomType = new RoomType({
                ...req.body,
                images,
                inclusions: parsedInclusions,
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
            const { hotel, oldImages, inclusions } = req.body;
            const { roomTypeId } = req.params;

            const { _, error } = roomTypeSchema.validate({
                ...req.body,
                inclusions: inclusions ? JSON.parse(inclusions) : [],
                oldImages: oldImages ? JSON.parse(oldImages) : [],
            });
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

            let parsedInclusions = [];
            if (inclusions) {
                parsedInclusions = JSON.parse(inclusions);
            }

            const roomType = await RoomType.findOneAndUpdate(
                {
                    isDeleted: false,
                    _id: roomTypeId,
                },
                {
                    ...req.body,
                    images: newImages,
                    inclusions: parsedInclusions,
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

    getSingleRoomType: async (req, res) => {
        try {
            const { roomTypeId } = req.params;

            if (!isValidObjectId(roomTypeId)) {
                return sendErrorResponse(res, 400, "invalid hotel id");
            }

            const roomType = await RoomType.findOne({
                _id: roomTypeId,
                isDeleted: false,
            });
            if (!roomType) {
                return sendErrorResponse(res, 404, "room type not found");
            }

            res.status(200).json(roomType);
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },
};
