const { isValidObjectId, Types } = require("mongoose");

const { sendErrorResponse } = require("../../helpers");
const {
    Attraction,
    AttractionCategory,
    AttractionActivity,
    Destination,
    AttractionOrder,
    AttractionReview,
} = require("../../models");
const {
  attractionSchema,
  attractionActivitySchema,
} = require("../validations/attraction.schema");

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
        mapLink,
        isOffer,
        offerAmountType,
        offerAmount,
        youtubeLink,
        sections,
        isCustomDate,
        startDate,
        endDate,
        duration,
        durationType,
        availability,
        offDates,
        bookingType,
        destination,
        highlights,
        faqs,
        cancellationType,
        cancelBeforeTime,
        cancellationFee,
        isApiConnected,
        isCombo,
        bookingPriorDays,
      } = req.body;

      const { _, error } = attractionSchema.validate({
        ...req.body,
        sections: sections ? JSON.parse(sections) : [],
        faqs: faqs ? JSON.parse(faqs) : [],
        offDates: offDates ? JSON.parse(offDates) : [],
        availability: availability ? JSON.parse(availability) : [],
      });
      if (error) {
        return sendErrorResponse(res, 400, error.details[0].message);
      }

      if (!isValidObjectId(category)) {
        return sendErrorResponse(res, 400, "Invalid category Id");
      }

      const attractionCategory = await AttractionCategory.findById(category);
      if (!attractionCategory) {
        return sendErrorResponse(res, 404, "Category not found!");
      }

      if (!isValidObjectId(destination)) {
        return sendErrorResponse(res, 400, "Invalid destination id");
      }

      const destinationDetails = await Destination.findOne({
        _id: destination,
        isDeleted: false,
      });
      if (!destinationDetails) {
        return sendErrorResponse(res, 404, "Destination not found");
      }

      let images = [];
      let image = req.files["images"];
      for (let i = 0; i < image.length; i++) {
        const img = "/" + image[i]?.path?.replace(/\\/g, "/");
        images.push(img);
      }

      let logos = req.files["logo"];
      const logo =  "/" + logos[i]?.path?.replace(/\\/g, "/");

      let parsedSections;
      if (sections) {
        parsedSections = JSON.parse(sections);
      }

      let parsedFaqs;
      if (faqs) {
        parsedFaqs = JSON.parse(faqs);
      }

      let parsedOffDates;
      if (offDates) {
        parsedOffDates = JSON.parse(offDates);
      }

      let parsedAvailability;
      if (availability) {
        parsedAvailability = JSON.parse(availability);
      }

            const newAttraction = new Attraction({
                title,
                bookingType,
                category,
                mapLink,
                isActive,
                isOffer,
                offerAmountType,
                offerAmount,
                youtubeLink,
                images,
                sections: parsedSections,
                startDate,
                isCustomDate,
                endDate,
                offDates: parsedOffDates,
                availability: parsedAvailability,
                duration,
                durationType,
                destination,
                highlights,
                faqs: parsedFaqs,
                cancellationType,
                cancelBeforeTime,
                cancellationFee,
                isApiConnected,
                isCombo,
                bookingPriorDays,
                isActive: true,
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
        mapLink,
        isOffer,
        offerAmountType,
        offerAmount,
        youtubeLink,
        sections,
        isCustomDate,
        startDate,
        endDate,
        duration,
        durationType,
        availability,
        offDates,
        bookingType,
        destination,
        highlights,
        faqs,
        cancellationType,
        cancelBeforeTime,
        cancellationFee,
        isApiConnected,
        isCombo,
        oldImages,
        bookingPriorDays,
      } = req.body;

      const { _, error } = attractionSchema.validate({
        ...req.body,
        sections: sections ? JSON.parse(sections) : [],
        faqs: faqs ? JSON.parse(faqs) : [],
        offDates: offDates ? JSON.parse(offDates) : [],
        availability: availability ? JSON.parse(availability) : [],
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

      const attractionCategory = await AttractionCategory.findById(category);
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

      let parsedFaqs;
      if (faqs) {
        parsedFaqs = JSON.parse(faqs);
      }

      let parsedOffDates;
      if (offDates) {
        parsedOffDates = JSON.parse(offDates);
      }

      let parsedAvailability;
      if (availability) {
        parsedAvailability = JSON.parse(availability);
      }

      const attraction = await Attraction.findOneAndUpdate(
        { _id: id, isDeleted: false },
        {
          title,
          bookingType,
          category,
          mapLink,
          isActive,
          isOffer,
          offerAmountType,
          offerAmount,
          youtubeLink,
          images: newImages,
          sections: parsedSections,
          startDate,
          isCustomDate,
          endDate,
          offDates: parsedOffDates,
          availability: parsedAvailability,
          duration,
          durationType,
          destination,
          highlights,
          faqs: parsedFaqs,
          cancellationType,
          cancelBeforeTime,
          cancellationFee,
          isApiConnected,
          isCombo,
          bookingPriorDays,
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
        description,
        activityType,
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
        isSharedTransferAvailable,
        sharedTransferPrice,
        sharedTransferCost,
        isPrivateTransferAvailable,
        privateTransfers,
        isActive,
        peakTime,
        note,
        childCost,
        adultCost,
        infantCost,
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

            let isCostNee = true;
            if (attr.bookingType === "booking" && activityType === "normal") {
                noCostNeeded = false;
            } else {
            }

            const newTicket = new AttractionActivity({
                attraction,
                name,
                activityType,
                description,
                adultAgeLimit,
                adultPrice,
                childAgeLimit,
                childPrice,
                infantAgeLimit,
                infantPrice,
                isCancelable,
                isVat,
                vat: isVat && vat,
                base,
                isSharedTransferAvailable,
                sharedTransferPrice:
                    isSharedTransferAvailable && sharedTransferPrice,
                sharedTransferCost:
                    isSharedTransferAvailable && sharedTransferCost,
                isPrivateTransferAvailable,
                privateTransfers,
                isActive,
                peakTime,
                note,
                childCost,
                adultCost,
                infantCost,
            });
            await newTicket.save();

            res.status(200).json(newTicket);
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

  getAllAttractions: async (req, res) => {
    try {
      const { skip = 0, limit = 10, search } = req.query;

      const filters = { isDeleted: false };

      if (search && search !== "") {
        filters.title = { $regex: search, $options: "i" };
      }

            const attractions = await Attraction.aggregate([
                { $match: filters },
                {
                    $lookup: {
                        from: "destinations",
                        localField: "destination",
                        foreignField: "_id",
                        as: "destination",
                    },
                },
                {
                    $lookup: {
                        from: "attractionreviews",
                        localField: "_id",
                        foreignField: "attraction",
                        as: "reviews",
                    },
                },
                {
                    $lookup: {
                        from: "b2cattractionmarkups",
                        localField: "_id",
                        foreignField: "attraction",
                        as: "markup",
                    },
                },
                {
                    $set: {
                        totalRating: {
                            $sum: {
                                $map: {
                                    input: "$reviews",
                                    in: "$$this.rating",
                                },
                            },
                        },
                        totalReviews: {
                            $size: "$reviews",
                        },
                        destination: { $arrayElemAt: ["$destination", 0] },
                        markup: { $arrayElemAt: ["$markup", 0] },
                    },
                },
                {
                    $project: {
                        title: 1,
                        bookingType: 1,
                        isOffer: 1,
                        offerAmountType: 1,
                        offerAmount: 1,
                        destination: 1,
                        totalReviews: 1,
                        averageRating: {
                            $cond: [
                                { $eq: ["$totalReviews", 0] },
                                0,
                                { $divide: ["$totalRating", "$totalReviews"] },
                            ],
                        },
                        createdAt: 1,
                        markup: 1,
                    },
                },
                {
                    $sort: { createdAt: -1 },
                },
                {
                    $skip: Number(limit) * Number(skip),
                },
                {
                    $limit: Number(limit),
                },
            ]);

      const totalAttractions = await Attraction.find(filters).count();

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
      const categories = await AttractionCategory.find({});

      res.status(200).json({ categories });
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

      const attraction = await Attraction.aggregate([
        { $match: { _id: Types.ObjectId(id), isDeleted: false } },
        {
          $lookup: {
            from: "attractionactivities",
            foreignField: "attraction",
            localField: "_id",
            as: "activities",
          },
        },
        {
          $addFields: {
            activities: {
              $filter: {
                input: "$activities",
                as: "item",
                cond: { $eq: ["$$item.isDeleted", false] },
              },
            },
          },
        },
      ]);

      if (!attraction || attraction?.length < 1) {
        return sendErrorResponse(res, 404, "Attraction not found");
      }

      res.status(200).json(attraction[0]);
    } catch (err) {
      sendErrorResponse(res, 500, err);
    }
  },

  deleteAttraction: async (req, res) => {
    try {
      const { id } = req.params;

      if (!isValidObjectId(id)) {
        return sendErrorResponse(res, 400, "Invalid attraction id");
      }

      const attraction = await Attraction.findByIdAndUpdate(id, {
        isDeleted: true,
      });
      if (!attraction) {
        return sendErrorResponse(res, 400, "Attraction not found");
      }

      res.status(200).json({
        message: "Attraction successfully deleted",
        _id: id,
      });
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

      const attraction = await Attraction.findById(id).select("title");
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
        attraction,
        totalAttractionReviews,
        skip: Number(skip),
        limit: Number(limit),
      });
    } catch (err) {
      sendErrorResponse(res, 500, err);
    }
  },

  getSingleActivity: async (req, res) => {
    try {
      const { activityId } = req.params;

      if (!isValidObjectId(activityId)) {
        return sendErrorResponse(res, 400, "Invalid activity id");
      }

      const activity = await AttractionActivity.findOne({
        isDeleted: false,
        _id: activityId,
      }).populate("attraction", "title bookingType");

      if (!activity) {
        return sendErrorResponse(res, 404, "Activity not found");
      }

      res.status(200).json(activity);
    } catch (err) {
      sendErrorResponse(res, 500, err);
    }
  },

    updateActivity: async (req, res) => {
        try {
            const { activityId } = req.params;
            const {
                attraction,
                name,
                description,
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
                childCost,
                adultCost,
                infantCost,
            } = req.body;

            const { _, error } = attractionActivitySchema.validate(req.body);
            if (error) {
                return sendErrorResponse(res, 400, error.details[0].message);
            }

      if (!isValidObjectId(activityId)) {
        return sendErrorResponse(res, 400, "Invalid activity id");
      }

            const activity = await AttractionActivity.findOneAndUpdate(
                {
                    isDeleted: false,
                    _id: activityId,
                },
                {
                    attraction,
                    name,
                    description,
                    adultAgeLimit,
                    adultPrice,
                    childAgeLimit,
                    childPrice,
                    infantAgeLimit,
                    infantPrice,
                    isCancelable,
                    isVat,
                    vat: isVat && vat,
                    base,
                    isTransferAvailable,
                    privateTransferPrice:
                        isTransferAvailable && privateTransferPrice,
                    sharedTransferPrice:
                        isTransferAvailable && sharedTransferPrice,
                    isActive,
                    peakTime,
                    note,
                    childCost,
                    adultCost,
                    infantCost,
                },
                { runValidators: true }
            );

      if (!activity) {
        return sendErrorResponse(res, 404, "Activity not found");
      }

      res.status(200).json({
        message: "Activity successfully updated",
        _id: activityId,
      });
    } catch (err) {
      sendErrorResponse(res, 500, err);
    }
  },

  deleteActivity: async (req, res) => {
    try {
      const { activityId } = req.params;

      if (!isValidObjectId(activityId)) {
        return sendErrorResponse(res, 400, "Invalid activity id");
      }

      const activity = await AttractionActivity.findOneAndUpdate(
        {
          isDeleted: false,
          _id: activityId,
        },
        { isDeleted: true }
      );

      if (!activity) {
        return sendErrorResponse(res, 404, "Activity not found");
      }

      res.status(200).json({
        message: "Activity successfully deleted",
        _id: activityId,
      });
    } catch (err) {
      sendErrorResponse(res, 500, err);
    }
  },

  getSingleAttractionBasicData: async (req, res) => {
    try {
      const { id } = req.params;

      if (!isValidObjectId(id)) {
        return sendErrorResponse(res, 400, "Invalid Attraction Id");
      }

      const attraction = await Attraction.findOne({
        isDeleted: false,
        _id: id,
      }).select("title bookingType");
      if (!attraction) {
        return sendErrorResponse(res, 404, "Attraction not found");
      }

      res.status(200).json(attraction);
    } catch (err) {
      sendErrorResponse(res, 500, err);
    }
  },

  deleteAttractionReview: async (req, res) => {
    try {
      const { reviewId } = req.params;

      if (!isValidObjectId(reviewId)) {
        return sendErrorResponse(res, 400, "Invalid Review Id");
      }

      const review = await AttractionReview.findByIdAndDelete(reviewId);

      if (!review) {
        return sendErrorResponse(res, 404, "Review not found");
      }

            res.status(200).json({
                message: "Review successfully deleted",
                reviewId,
            });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },
};
