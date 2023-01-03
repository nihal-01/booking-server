const { isValidObjectId } = require("mongoose");
const { sendErrorResponse } = require("../helpers");
const {
    attractionReviewSchema,
} = require("../validations/attractionReview.schema");
const { Attraction, AttractionReview } = require("../models");

module.exports = {
    addAttractionReview: async (req, res) => {
        try {
            const { title, description, rating, attraction } = req.body;

            const { _, error } = attractionReviewSchema.validate(req.body);
            if (error) {
                return sendErrorResponse(res, 400, error.details[0].message);
            }

            if (!isValidObjectId(attraction)) {
                return sendErrorResponse(res, 400, "Invalid attraction id");
            }

            const attractionDetails = await Attraction.findById(attraction);
            if (!attractionDetails) {
                return sendErrorResponse(res, 404, "Attraction not found");
            }

            const existingReview = await AttractionReview.findOne({
                attraction,
                user: req.user._id,
            });
            if (existingReview) {
                return sendErrorResponse(
                    res,
                    400,
                    "You already submitted review for this attraction, Thank you"
                );
            }

            const newAttractionReview = new AttractionReview({
                title,
                description,
                rating,
                attraction,
                user: req.user._id,
            });
            await newAttractionReview.save();

            res.status(200).json(newAttractionReview);
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    getSingleAttractionReviews: async (req, res) => {
        try {
            const { id } = req.params;
            const { skip = 0, limit = 10 } = req.query;

            if (!isValidObjectId(id)) {
                return sendErrorResponse(res, 400, "Invalid attraction id");
            }

            const attraction = await Attraction.findById(id);
            if (!attraction) {
                return sendErrorResponse(res, 404, "Attraction not found");
            }

            const attractionReviews = await AttractionReview.find({
                attraction: id,
            })
                .populate("user", "name avatar email")
                .sort({ createdAt: -1 })
                .limit(limit)
                .skip(limit * skip)
                .lean();

            const totalAttractionReviews = await AttractionReview.find({
                attraction: id,
            }).count();

            res.status(200).json({
                attractionReviews,
                totalAttractionReviews,
                skip: Number(skip),
                limit: Number(limit),
            });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },
};
