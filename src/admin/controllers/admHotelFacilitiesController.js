const { isValidObjectId } = require("mongoose");

const { sendErrorResponse } = require("../../helpers");
const { HotelFacility } = require("../../models");
const {
    hotelFacilitySchema,
} = require("../validations/admHotelFacility.schema");

module.exports = {
    addNewHotelFacility: async (req, res) => {
        try {
            const { name } = req.body;

            const { _, error } = hotelFacilitySchema.validate(req.body);
            if (error) {
                return sendErrorResponse(res, 400, error.details[0].message);
            }

            if (!req.file?.path) {
                return sendErrorResponse(res, 400, "icon is required");
            }

            let iconImgPath;
            if (req.file?.path) {
                iconImgPath = "/" + req.file.path.replace(/\\/g, "/");
            }

            const newHotelFacility = new HotelFacility({
                name,
                icon: iconImgPath,
            });
            await newHotelFacility.save();

            res.status(200).json(newHotelFacility);
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    updateHotelFacility: async (req, res) => {
        try {
            const { name } = req.body;
            const { id } = req.params;

            const { _, error } = hotelFacilitySchema.validate(req.body);
            if (error) {
                return sendErrorResponse(res, 400, error.details[0].message);
            }

            if (!isValidObjectId(id)) {
                return sendErrorResponse(res, 400, "invalid hotel id");
            }

            let iconImgPath;
            if (req.file?.path) {
                iconImgPath = "/" + req.file.path.replace(/\\/g, "/");
            }

            const hotelFacility = await HotelFacility.findByIdAndUpdate(
                id,
                { name, icon: iconImgPath },
                { runValidators: true, new: true }
            );

            if (!hotelFacility) {
                return sendErrorResponse(res, 404, "hotel facility not found");
            }

            res.status(200).json(hotelFacility);
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    deleteHotelFacility: async (req, res) => {
        try {
            const { id } = req.params;

            if (!isValidObjectId(id)) {
                return sendErrorResponse(res, 400, "invalid hotel facility id");
            }

            const hotelFacility = await HotelFacility.findByIdAndDelete(id);
            if (!hotelFacility) {
                return sendErrorResponse(res, 404, "hotel facility not found");
            }

            res.status(200).json({
                message: "hotel facility successfully deleted",
                _id: id,
            });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    getAllHotelFacilities: async (req, res) => {
        try {
            const hotelFacilities = await HotelFacility.find({}).sort({
                createdAt: -1,
            });
            res.status(200).json(hotelFacilities);
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },
};
