const { isValidObjectId, Types } = require("mongoose");
const { sendErrorResponse } = require("../../helpers");
const {
    AttractionItinerary,
    Attraction,
    AttractionActivity,
} = require("../../models");
const {
    attractionItinerarySchema,
} = require("../validations/admAttractionItinerary.schema");

module.exports = {
    createAttractionItinerary: async (req, res) => {
        try {
            const { itineraries } = req.body;

            const { _, error } = attractionItinerarySchema.validate(req.body);
            if (error) {
                return sendErrorResponse(res, 400, error.details[0].message);
            }

            for (let i = 0; i < itineraries?.length; i++) {
                for (let j = 0; j < itineraries[i]?.items?.length; j++) {
                    const attraction = await Attraction.findOne({
                        _id: itineraries[i]?.items[j]?.attraction,
                        isDeleted: false,
                    });
                    if (!attraction) {
                        return sendErrorResponse(
                            res,
                            400,
                            `itineraries[${i}].attraction not found`
                        );
                    }

                    const activity = await AttractionActivity.findOne({
                        _id: itineraries[i]?.items[j]?.activity,
                        attraction: attraction._id,
                        isDeleted: false,
                    });
                    if (!activity) {
                        return sendErrorResponse(
                            res,
                            400,
                            `itineraries[${i}].activity not found`
                        );
                    }
                }
            }

            // let noOfNights = itineraries.length;
            // let noOfDays = itineraries.length + 1;

            const newAttractionItinerary = new AttractionItinerary({
                ...req.body,
            });
            await newAttractionItinerary.save();

            res.status(200).json({
                message: "itinerary successfully added",
                _id: newAttractionItinerary?._id,
            });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    deleteAttractionItinerary: async (req, res) => {
        try {
            const { id } = req.params;

            if (!isValidObjectId(id)) {
                return sendErrorResponse(res, 400, "invalid itinerary id");
            }

            const attractionItinerary =
                await AttractionItinerary.findByIdAndDelete(id);
            if (!attractionItinerary) {
                return sendErrorResponse(
                    res,
                    404,
                    "attraction itinerary not found"
                );
            }

            res.status(200).json({
                message: "attraction itinerary successfully deleted",
                _id: id,
            });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    updateAttractionItinerary: async (req, res) => {
        try {
            const { id } = req.params;
            const { itineraries } = req.body;

            const { _, error } = attractionItinerarySchema.validate(req.body);
            if (error) {
                return sendErrorResponse(res, 400, error.details[0].message);
            }

            if (!isValidObjectId(id)) {
                return sendErrorResponse(
                    res,
                    400,
                    "invalid attraction itinerary id"
                );
            }

            for (let i = 0; i < itineraries?.length; i++) {
                for (let j = 0; j < itineraries[i]?.items?.length; j++) {
                    const attraction = await Attraction.findOne({
                        _id: itineraries[i]?.items[j]?.attraction,
                        isDeleted: false,
                    });
                    if (!attraction) {
                        return sendErrorResponse(
                            res,
                            400,
                            `itineraries[${i}].attraction not found`
                        );
                    }

                    const activity = await AttractionActivity.findOne({
                        _id: itineraries[i]?.items[j]?.activity,
                        attraction: attraction._id,
                        isDeleted: false,
                    });
                    if (!activity) {
                        return sendErrorResponse(
                            res,
                            400,
                            `itineraries[${i}].activity not found`
                        );
                    }
                }
            }

            const attractionItinerary =
                await AttractionItinerary.findOneAndUpdate(
                    {
                        _id: id,
                    },
                    { ...req.body }
                );

            res.status(200).json({
                message: "itinerary updated successfully",
                _id: attractionItinerary?._id,
            });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    getAllAttractionItineraries: async (req, res) => {
        try {
            const { skip = 0, limit = 10 } = req.query;

            const attrctionItineraries = await AttractionItinerary.find({})
                .sort({ createdAt: -1 })
                .limit(limit)
                .skip(limit * skip)
                .lean();

            const totalAttractionItineraries =
                await AttractionItinerary.count();

            res.status(200).json({
                attrctionItineraries,
                totalAttractionItineraries,
                skip: Number(skip),
                limit: Number(limit),
            });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    getSingleAttractionItinerary: async (req, res) => {
        try {
            const { id } = req.params;

            if (!isValidObjectId(id)) {
                return sendErrorResponse(res, 400, "invalid itinerary id");
            }

            const attractionItinerary = await AttractionItinerary.findOne({
                _id: id,
            })
                .populate({
                    path: "itineraries.items.attraction",
                    select: "title itineraryDescription images",
                })
                .populate({
                    path: "itineraries.items.activity",
                    select: "name",
                });

            if (!attractionItinerary) {
                return sendErrorResponse(
                    res,
                    404,
                    "attraction itinerary not found"
                );
            }

            res.status(200).json(attractionItinerary);
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },
};
