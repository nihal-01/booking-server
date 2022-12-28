const { isValidObjectId } = require("mongoose");

const { sendErrorResponse } = require("../../helpers");
const {
    Attraction,
    AttractionCategory,
    AttractionActivity,
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
                availability,
                availableDays,
                startDate,
                endDate,
                duration,
                durationType,
            } = req.body;

            const { _, error } = attractionSchema.validate({
                ...req.body,
                availableDays: availableDays ? JSON.parse(availableDays) : [],
            });
            if (error) {
                return sendErrorResponse(res, 400, error.details[0].message);
            }

            if (!isValidObjectId(id)) {
                return sendErrorResponse(res, 400, "Invalid attraction id");
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

            let newImages = [];
            for (let i = 0; i < req.files?.length; i++) {
                const img = "/" + req.files[i]?.path?.replace(/\\/g, "/");
                newImages.push(img);
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
                    $push: { images: newImages },
                    pickupAndDrop,
                    sections,
                    availability,
                    availableDays,
                    startDate,
                    endDate,
                    duration,
                    durationType,
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

    // deleteImage: async (req, res) => {
    //     try {

    //     } catch (err) {
    //         sendErrorResponse(res, 500, err)
    //     }
    // },

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
};
