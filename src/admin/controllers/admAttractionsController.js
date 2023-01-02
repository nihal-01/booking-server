const { isValidObjectId } = require("mongoose");

const { sendErrorResponse } = require("../../helpers");
const {
    Attraction,
    AttractionCategory,
    AttractionActivity,
    Destination,
} = require("../../models");
const {
    attractionSchema,
    attractionActivitySchema,
} = require("../validations/attraction.schema");
const { getDates } = require("../../utils");

const weekday = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
];

module.exports = {
    createNewAttraction: async (req, res) => {
        try {
            const {
                title,
                category,
                isActive,
                latitude,
                longitude,
                isOffer,
                offerAmountType,
                offerAmount,
                youtubeLink,
                pickupAndDrop,
                sections,
                startDate,
                endDate,
                duration,
                durationType,
                offDays,
                offDates,
                bookingType,
                destination,
                highlights,
            } = req.body;

            const { _, error } = attractionSchema.validate({
                ...req.body,
                offDays: offDays ? JSON.parse(offDays) : [],
                sections: sections ? JSON.parse(sections) : [],
            });
            if (error) {
                return sendErrorResponse(res, 400, error.details[0].message);
            }

            if (!isValidObjectId(category)) {
                return sendErrorResponse(res, 400, "Invalid category Id");
            }

            const attractionCategory = await AttractionCategory.findById(
                category
            );
            if (!attractionCategory) {
                return sendErrorResponse(res, 404, "Category not found!");
            }

            if (!isValidObjectId(destination)) {
                return sendErrorResponse(res, 400, "Invalid destination id");
            }

            const destinationDetails = await Destination.findById(destination);
            if (!destinationDetails) {
                return sendErrorResponse(res, 404, "Destination not found");
            }

            let offDatesList = [];
            offDates && offDatesList.push(offDates);

            if (offDays) {
                console.log(JSON.parse(offDays));
                const offDaysFiltered = JSON.parse(offDays).map((day) => {
                    return day?.toLowerCase();
                });

                if (offDaysFiltered.length > 0) {
                    const dates = getDates(startDate, endDate);

                    for (let i = 0; i < dates.length; i++) {
                        const day = weekday[new Date(dates[i]).getDay()];

                        if (offDays?.includes(day.toLowerCase())) {
                            offDatesList.push(dates[i]);
                        }
                    }
                }
            }

            let images = [];
            for (let i = 0; i < req.files?.length; i++) {
                const img = "/" + req.files[i]?.path?.replace(/\\/g, "/");
                images.push(img);
            }

            let parsedSections;
            if (sections) {
                parsedSections = JSON.parse(sections);
            }

            const newAttraction = new Attraction({
                title,
                bookingType,
                category,
                isActive,
                latitude,
                longitude,
                isOffer,
                offerAmountType,
                offerAmount,
                youtubeLink,
                images,
                pickupAndDrop,
                sections: parsedSections,
                startDate,
                endDate,
                offDays: offDatesList,
                duration,
                durationType,
                destination,
                highlights,
            });
            await newAttraction.save();

            res.status(200).json(newAttraction);
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    updateAttraction: async (req, res) => {
        try {
            const { id } = req.params;
            const {
                title,
                category,
                isActive,
                latitude,
                longitude,
                isOffer,
                offerAmountType,
                offerAmount,
                youtubeLink,
                pickupAndDrop,
                sections,
                startDate,
                endDate,
                duration,
                durationType,
                offDays,
                offDates,
                bookingType,
                destination,
                highlights,
                oldImages,
            } = req.body;

            const { _, error } = attractionSchema.validate({
                ...req.body,
                offDays: offDays ? JSON.parse(offDays) : [],
                sections: sections ? JSON.parse(sections) : [],
                oldImages: oldImages ? JSON.parse(oldImages) : [],
            });
            if (error) {
                return sendErrorResponse(res, 400, error.details[0].message);
            }

            if (!isValidObjectId(id)) {
                return sendErrorResponse(res, 400, "Invalid attraction id");
            }

            if (category && !isValidObjectId(category)) {
                return sendErrorResponse(res, 400, "Invalid category Id");
            }

            const attractionCategory = await AttractionCategory.findById(
                category
            );
            if (!attractionCategory) {
                return sendErrorResponse(res, 404, "Category not found!");
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

            let parsedSections;
            if (sections) {
                parsedSections = JSON.parse(sections);
            }

            const attraction = await Attraction.findByIdAndUpdate(
                id,
                {
                    title,
                    category,
                    isActive,
                    latitude,
                    longitude,
                    isOffer,
                    offerAmountType,
                    offerAmount,
                    youtubeLink,
                    images: newImages,
                    pickupAndDrop,
                    sections: parsedSections,
                    startDate,
                    endDate,
                    duration,
                    durationType,
                    offDates,
                    bookingType,
                    destination,
                    highlights,
                },
                { runValidators: true, new: true }
            );

            if (!attraction) {
                return sendErrorResponse(res, 404, "Attraction not found");
            }

            res.status(200).json(attraction);
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    addAttractionActivity: async (req, res) => {
        try {
            const {
                attraction,
                name,
                facilities,
                adultAgeLimit,
                adultPrice,
                childAgeLimit,
                childPrice,
                infantAgeLimit,
                infantPrice,
                isCancelable,
                isVat,
                vat,
                base,
                isTransferAvailable,
                privateTransferPrice,
                sharedTransferPrice,
                isActive,
                peakTime,
                note,
            } = req.body;

            const { _, error } = attractionActivitySchema.validate(req.body);
            if (error) {
                return sendErrorResponse(res, 400, error.details[0].message);
            }

            if (!isValidObjectId(attraction)) {
                return sendErrorResponse(res, 400, "Invalid attraction id!");
            }

            const attr = await Attraction.findById(attraction);
            if (!attr) {
                return sendErrorResponse(res, 404, "Attraction not found");
            }

            const newTicket = new AttractionActivity({
                attraction,
                name,
                facilities,
                adultAgeLimit,
                adultPrice,
                childAgeLimit,
                childPrice,
                infantAgeLimit,
                infantPrice,
                isCancelable,
                isVat,
                vat,
                base,
                isTransferAvailable,
                privateTransferPrice,
                sharedTransferPrice,
                isActive,
                peakTime,
                note,
            });
            await newTicket.save();

            res.status(200).json(newTicket);
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    uploadTickets: async (req, res) => {
        try {
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    getAllAttractions: async (req, res) => {
        try {
            const { skip = 0, limit = 10 } = req.query;

            const attractions = await Attraction.find({})
                .populate("destination")
                .sort({ createdAt: -1 })
                .limit(limit)
                .skip(limit * skip)
                .lean();

            const totalAttractions = await Attraction.find({}).count();

            res.status(200).json({
                attractions,
                totalAttractions,
                skip: Number(skip),
                limit: Number(limit),
            });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    getInitialData: async (req, res) => {
        try {
            const destinations = await Destination.find({});
            const categories = await AttractionCategory.find({});

            res.status(200).json({ destinations, categories });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    getSingleAttraction: async (req, res) => {
        try {
            const { id } = req.params;

            if (!isValidObjectId(id)) {
                return sendErrorResponse(res, 400, "Invalid attraction id");
            }

            const attraction = await Attraction.findById(id)
                .populate("activities")
                .lean();

            if (!attraction) {
                return sendErrorResponse(res, 404, "Attraction not found");
            }

            res.status(200).json(attraction);
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },
};
