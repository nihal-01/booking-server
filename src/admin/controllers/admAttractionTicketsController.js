const fs = require("fs");
const { parse } = require("csv-parse");

const { sendErrorResponse, createQuotationPdf } = require("../../helpers");
const { AttractionTicket, AttractionActivity } = require("../../models");
const { isValidObjectId } = require("mongoose");
const {
    attractionTicketUploadSchema,
} = require("../validations/attraction.schema");

module.exports = {
    uploadTicket: async (req, res) => {
        try {
            const { activity } = req.body;

            const { _, error } = attractionTicketUploadSchema.validate(
                req.body
            );
            if (error) {
                return sendErrorResponse(res, 400, error.details[0].message);
            }

            if (!isValidObjectId(activity)) {
                return sendErrorResponse(res, 400, "Invalid activity id");
            }

            const activityDetails = await AttractionActivity.findOne({
                _id: activity,
                isDeleted: false,
            }).populate("attraction");
            if (!activityDetails) {
                return sendErrorResponse(res, 400, "Activity not found");
            }

            if (!activityDetails?.attraction) {
                return sendErrorResponse(
                    res,
                    400,
                    "Attraction not found or disabled"
                );
            }

            if (activityDetails?.attraction?.bookingType !== "ticket") {
                return sendErrorResponse(
                    res,
                    400,
                    "You can't upload ticket to type 'booking'"
                );
            }

            if (!req.file) {
                return sendErrorResponse(res, 500, "CSV file is required");
            }

            let csvRow = 0;
            let ticketsList = [];
            let newTickets = [];
            let errorTickets = [];
            const uploadTickets = async () => {
                for (let i = 0; i < ticketsList?.length; i++) {
                    try {
                        const ticket = await AttractionTicket.findOne({
                            ticketNo: ticketsList[i]?.ticketNo?.toUpperCase(),
                            activity,
                        });
                        if (!ticket) {
                            let dateString;
                            if (ticketsList[i]?.validity === true) {
                                var parts =
                                    ticketsList[i]?.validTill?.split("-");
                                dateString = new Date(
                                    parts[2],
                                    parts[1] - 1,
                                    parts[0]
                                ).toDateString();
                            }
                            const newTicket = new AttractionTicket({
                                ticketNo: ticketsList[i]?.ticketNo,
                                lotNo: ticketsList[i]?.lotNo,
                                activity: ticketsList[i]?.activity,
                                validity: ticketsList[i]?.validity,
                                validTill: dateString,
                                details: ticketsList[i]?.details,
                                ticketFor:
                                    ticketsList[i]?.ticketFor?.toLowerCase(),
                                ticketCost: ticketsList[i]?.ticketCost,
                            });
                            await newTicket.save();
                            newTickets.push(Object(newTicket));
                        }
                    } catch (err) {
                        console.log(err);
                        errorTickets.push(ticketsList[i]?.ticketNo);
                    }
                }
            };

            fs.createReadStream(req.file?.path)
                .pipe(parse({ delimiter: "," }))
                .on("data", async function (csvrow) {
                    if (csvRow !== 0) {
                        ticketsList.push({
                            ticketNo: csvrow[0],
                            lotNo: csvrow[1],
                            activity,
                            validity: csvrow[2]?.toLowerCase() === "y",
                            validTill: csvrow[3],
                            details: csvrow[4],
                            ticketFor: csvrow[5],
                            ticketCost: csvrow[6],
                        });
                    }
                    csvRow += 1;
                })
                .on("end", async function () {
                    await uploadTickets();

                    if (errorTickets?.length > 0) {
                        return res.status(200).json({
                            status: "error",
                            message: `${errorTickets} not uploaded, please try with correct details`,
                            newTickets,
                        });
                    }

                    res.status(200).json({
                        message: "Tickets successfully uploaded",
                        status: "ok",
                        newTickets,
                    });
                })
                .on("error", function (err) {
                    sendErrorResponse(
                        res,
                        400,
                        "Something went wrong, Wile parsing CSV"
                    );
                });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    getSingleActivitiesTicket: async (req, res) => {
        try {
            const { activityId } = req.params;
            const { skip = 0, limit = 10 } = req.query;

            if (!isValidObjectId) {
                return sendErrorResponse(res, 400, "invalid activity id");
            }

            const activity = await AttractionActivity.findOne({
                isDeleted: false,
                _id: activityId,
            })
                .populate("attraction", "bookingType")
                .select("name attraction");

            if (!activity) {
                return sendErrorResponse(res, 404, "activity not found");
            }

            if (activity.attraction?.bookingType !== "ticket") {
                return sendErrorResponse(
                    res,
                    400,
                    "this type `booking` has no tickets"
                );
            }

            const tickets = await AttractionTicket.find({
                activity: activityId,
            })
                .sort({ createdAt: -1 })
                .limit(limit)
                .skip(limit * skip);

            const totalTickets = await AttractionTicket.find({
                activity: activityId,
            }).count();

            res.status(200).json({
                tickets,
                totalTickets,
                limit: Number(limit),
                skip: Number(skip),
                activity,
            });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    updateTicketStatus: async (req, res) => {
        try {
            const { id } = req.params;

            if (!isValidObjectId(id)) {
                return sendErrorResponse(res, 400, "Invalid Ticket Id");
            }

            const ticket = await AttractionTicket.findById(id);

            if (!ticket) {
                return sendErrorResponse(res, 400, "Invalid Ticket Id");
            }

            if (ticket.status !== "ok") {
                return sendErrorResponse(
                    res,
                    400,
                    "Ticket Already Reserved Or Used"
                );
            }

            if (ticket.validity) {
                if (new Date(ticket.validTill) < new Date()) {
                    return sendErrorResponse(res, 400, "Ticket Date Experied");
                }
            }

            ticket.status = "used";
            await ticket.save();

            res.status(200).json({ status: ticket?.status });
        } catch (error) {
            sendErrorResponse(res, 500, error);
        }
    },

    downloadTicket: async (req, res) => {
        try {
            const { id } = req.params;

            if (!isValidObjectId(id)) {
                return sendErrorResponse(res, 400, "Invalid Ticket Id");
            }

            let ticketData = await AttractionTicket.findById(id);

            createQuotationPdf(ticketData);

            if (!ticketData) {
                sendErrorResponse(res, 400, "Ticket Not Found");
            }

            res.status(200).json({
                ticketData,
            });
        } catch (error) {
            sendErrorResponse(res, 500, error);
        }
    },

    deleteAttractionTicket: async (req, res) => {
        try {
            const { ticketId } = req.params;

            if (!isValidObjectId(ticketId)) {
                return sendErrorResponse(res, 400, "invalid ticket id");
            }

            const ticket = await AttractionTicket.findById(ticketId);
            if (!ticket) {
                return sendErrorResponse(res, 404, "ticket not found");
            }

            if (ticket.status !== "ok") {
                return sendErrorResponse(
                    res,
                    400,
                    "sorry, this ticket can't delete"
                );
            }

            await AttractionTicket.findByIdAndDelete(ticketId);

            res.status(200).json({
                message: "ticket successfully deleted",
                ticketNo: ticket?.ticketNo,
            });
        } catch (err) {
            sendErrorResponse(res, 400, err);
        }
    },

    singleAttractionTicket: async (req, res) => {
        try {
            const { ticketId } = req.params;

            if (!isValidObjectId(ticketId)) {
                return sendErrorResponse(res, 400, "invalid ticket id");
            }

            const ticket = await AttractionTicket.findOne({
                _id: ticketId,
            }).populate({
                path: "activity",
                populate: {
                    path: "attraction",
                    populate: { path: "destination" },
                    select: "title images logo",
                },
                select: "name description",
            });

            if (!ticket) {
                return sendErrorResponse(res, 400, "ticket not found");
            }

            res.status(200).json(ticket);
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    getActivityTicketsStatistics: async (req, res) => {
        try {
            const { activityId } = req.params;

            if (!isValidObjectId(activityId)) {
                return sendErrorResponse(res, 400, "invalid activity id");
            }

            const activity = await AttractionActivity.findOne({
                _id: activityId,
                isDeleted: false,
            }).populate("attraction", "bookingType");
            if (!activity) {
                return sendErrorResponse(res, 404, "activity not found");
            }

            if (activity?.attraction?.bookingType !== "ticket") {
                return sendErrorResponse(
                    res,
                    400,
                    "invalid attraction booking type"
                );
            }

            const totalTickets = await AttractionTicket.find({
                activity: activityId,
            }).count();
            const soldTickets = await AttractionTicket.find({
                status: "used",
                activity: activityId,
            }).count();
            const expiredTickets = await AttractionTicket.find({
                status: "ok",
                validTill: { $lte: new Date() },
                activity: activityId,
            }).count();
            const availableTickets = await AttractionTicket.find({
                $or: [
                    {
                        validity: true,
                        validTill: {
                            $gte: new Date(),
                        },
                    },
                    { validity: false },
                ],
                status: "ok",
                activity: activityId,
            }).count();

            const totalAdultTickets = await AttractionTicket.find({
                activity: activityId,
                ticketFor: "adult",
            }).count();
            const adultSoldTickets = await AttractionTicket.find({
                status: "used",
                activity: activityId,
                ticketFor: "adult",
            }).count();
            const adultExpiredTickets = await AttractionTicket.find({
                status: "ok",
                validTill: { $lte: new Date() },
                activity: activityId,
                ticketFor: "adult",
            }).count();
            const adultAvailableTickets = await AttractionTicket.find({
                $or: [
                    {
                        validity: true,
                        validTill: {
                            $gte: new Date(),
                        },
                    },
                    { validity: false },
                ],
                status: "ok",
                activity: activityId,
                ticketFor: "adult",
            }).count();

            const totalChildTickets = await AttractionTicket.find({
                activity: activityId,
                ticketFor: "child",
            }).count();
            const childSoldTickets = await AttractionTicket.find({
                status: "used",
                activity: activityId,
                ticketFor: "child",
            }).count();
            const childExpiredTickets = await AttractionTicket.find({
                status: "ok",
                validTill: { $lte: new Date() },
                activity: activityId,
                ticketFor: "child",
            }).count();
            const childAvailableTickets = await AttractionTicket.find({
                $or: [
                    {
                        validity: true,
                        validTill: {
                            $gte: new Date(),
                        },
                    },
                    { validity: false },
                ],
                status: "ok",
                activity: activityId,
                ticketFor: "child",
            }).count();

            const totalCommonTickets = await AttractionTicket.find({
                activity: activityId,
                ticketFor: "common",
            }).count();
            const commonSoldTickets = await AttractionTicket.find({
                status: "used",
                activity: activityId,
                ticketFor: "common",
            }).count();
            const commonExpiredTickets = await AttractionTicket.find({
                status: "ok",
                validTill: { $lte: new Date() },
                activity: activityId,
                ticketFor: "common",
            }).count();
            const commonAvailableTickets = await AttractionTicket.find({
                $or: [
                    {
                        validity: true,
                        validTill: {
                            $gte: new Date(),
                        },
                    },
                    { validity: false },
                ],
                status: "ok",
                activity: activityId,
                ticketFor: "adult",
            }).count();

            res.status(200).json({
                totalTickets,
                soldTickets,
                expiredTickets,
                availableTickets,
                totalAdultTickets,
                adultSoldTickets,
                adultExpiredTickets,
                adultAvailableTickets,
                totalChildTickets,
                childSoldTickets,
                childExpiredTickets,
                childAvailableTickets,
                totalCommonTickets,
                commonSoldTickets,
                commonExpiredTickets,
                commonAvailableTickets,
            });
        } catch (err) {
            sendErrorResponse(res, 400, err);
        }
    },

    getAllTicketsStatistics: async (req, res) => {
        try {
            const totalTickets = await AttractionTicket.find({}).count();
            const soldTickets = await AttractionTicket.find({
                status: "used",
            }).count();
            const expiredTickets = await AttractionTicket.find({
                status: "ok",
                validTill: { $lte: new Date() },
            }).count();
            const availableTickets = await AttractionTicket.find({
                $or: [
                    {
                        validity: true,
                        validTill: {
                            $gte: new Date(),
                        },
                    },
                    { validity: false },
                ],
                status: "ok",
            }).count();

            const totalAdultTickets = await AttractionTicket.find({
                ticketFor: "adult",
            }).count();
            const adultSoldTickets = await AttractionTicket.find({
                status: "used",
                ticketFor: "adult",
            }).count();
            const adultExpiredTickets = await AttractionTicket.find({
                status: "ok",
                validTill: { $lte: new Date() },
                ticketFor: "adult",
            }).count();
            const adultAvailableTickets = await AttractionTicket.find({
                $or: [
                    {
                        validity: true,
                        validTill: {
                            $gte: new Date(),
                        },
                    },
                    { validity: false },
                ],
                status: "ok",
                ticketFor: "adult",
            }).count();

            const totalChildTickets = await AttractionTicket.find({
                ticketFor: "child",
            }).count();
            const childSoldTickets = await AttractionTicket.find({
                status: "used",
                ticketFor: "child",
            }).count();
            const childExpiredTickets = await AttractionTicket.find({
                status: "ok",
                validTill: { $lte: new Date() },
                ticketFor: "child",
            }).count();
            const childAvailableTickets = await AttractionTicket.find({
                $or: [
                    {
                        validity: true,
                        validTill: {
                            $gte: new Date(),
                        },
                    },
                    { validity: false },
                ],
                status: "ok",
                ticketFor: "child",
            }).count();

            const totalCommonTickets = await AttractionTicket.find({
                ticketFor: "common",
            }).count();
            const commonSoldTickets = await AttractionTicket.find({
                status: "used",
                ticketFor: "common",
            }).count();
            const commonExpiredTickets = await AttractionTicket.find({
                status: "ok",
                validTill: { $lte: new Date() },
                ticketFor: "common",
            }).count();
            const commonAvailableTickets = await AttractionTicket.find({
                $or: [
                    {
                        validity: true,
                        validTill: {
                            $gte: new Date(),
                        },
                    },
                    { validity: false },
                ],
                status: "ok",
                ticketFor: "adult",
            }).count();

            const topSellingTickets = await AttractionTicket.aggregate([
                { $match: { status: "used" } },
                {
                    $lookup: {
                        from: "attractionactivities",
                        localField: "activity",
                        foreignField: "_id",
                        as: "activity",
                    },
                },
                {
                    $set: {
                        activity: { $arrayElemAt: ["$activity", 0] },
                    },
                },
                {
                    $lookup: {
                        from: "attractions",
                        localField: "activity.attraction",
                        foreignField: "_id",
                        as: "attraction",
                    },
                },
                {
                    $set: {
                        attraction: { $arrayElemAt: ["$attraction", 0] },
                    },
                },
                {
                    $group: {
                        _id: "$attraction._id",
                        soldTickets: { $sum: 1 },
                        activity: { $first: "$activity" },
                        attraction: { $first: "$attraction" },
                    },
                },
                {
                    $project: {
                        soldTickets: 1,
                        activity: {
                            name: 1,
                        },
                        attraction: {
                            title: 1,
                            images: 1,
                            _id: 1,
                        },
                    },
                },
                {
                    $sort: { soldTickets: -1 },
                },
                { $limit: 10 },
            ]);

            res.status(200).json({
                totalTickets,
                soldTickets,
                expiredTickets,
                availableTickets,
                totalAdultTickets,
                adultSoldTickets,
                adultExpiredTickets,
                adultAvailableTickets,
                totalChildTickets,
                childSoldTickets,
                childExpiredTickets,
                childAvailableTickets,
                totalCommonTickets,
                commonSoldTickets,
                commonExpiredTickets,
                commonAvailableTickets,
                topSellingTickets,
            });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    getActivitiesTicketsInfo: async (req, res) => {
        try {
            const { skip = 0, limit = 10, search } = req.query;

            const filters = {
                "attraction.bookingType": "ticket",
                isDeleted: false,
            };

            if (search && search !== "") {
                filters["attraction.title"] = { $regex: search, $options: "i" };
            }

            const activitiesTicketInfo = await AttractionActivity.aggregate([
                {
                    $match: {
                        isDeleted: false,
                    },
                },
                {
                    $lookup: {
                        from: "attractions",
                        localField: "attraction",
                        foreignField: "_id",
                        as: "attraction",
                    },
                },
                {
                    $set: {
                        attraction: { $arrayElemAt: ["$attraction", 0] },
                    },
                },
                {
                    $match: filters,
                },
                {
                    $lookup: {
                        from: "attractiontickets",
                        localField: "_id",
                        foreignField: "activity",
                        as: "tickets",
                    },
                },
                {
                    $project: {
                        totalTickets: { $size: "$tickets" },
                        availableTickets: {
                            $size: {
                                $filter: {
                                    input: "$tickets",
                                    as: "ticket",
                                    cond: {
                                        $and: [
                                            {
                                                $or: [
                                                    {
                                                        $and: [
                                                            {
                                                                $eq: [
                                                                    "$$ticket.validity",
                                                                    true,
                                                                ],
                                                            },
                                                            {
                                                                $gte: [
                                                                    "$$ticket.validTill",
                                                                    new Date().toISOString(),
                                                                ],
                                                            },
                                                        ],
                                                    },
                                                    {
                                                        $eq: [
                                                            "$$ticket.validity",
                                                            false,
                                                        ],
                                                    },
                                                ],
                                            },
                                            { $eq: ["$$ticket.status", "ok"] },
                                        ],
                                    },
                                },
                            },
                        },
                        soldTickets: {
                            $size: {
                                $filter: {
                                    input: "$tickets",
                                    as: "ticket",
                                    cond: {
                                        $eq: ["$$ticket.status", "used"],
                                    },
                                },
                            },
                        },
                        expiredTickets: {
                            $size: {
                                $filter: {
                                    input: "$tickets",
                                    as: "ticket",
                                    cond: {
                                        $and: [
                                            {
                                                $eq: [
                                                    "$$ticket.status",
                                                    "used",
                                                ],
                                            },
                                            {
                                                $lte: [
                                                    "$$ticket.validTill",
                                                    new Date().toISOString(),
                                                ],
                                            },
                                        ],
                                    },
                                },
                            },
                        },
                        attraction: {
                            title: 1,
                            _id: 1,
                        },
                        name: 1,
                    },
                },
                {
                    $sort: {
                        availableTickets: 1,
                    },
                },
                {
                    $group: {
                        _id: null,
                        totalActivities: { $sum: 1 },
                        data: { $push: "$$ROOT" },
                    },
                },
                {
                    $project: {
                        totalActivities: 1,
                        data: {
                            $slice: [
                                "$data",
                                Number(limit) * Number(skip),
                                Number(limit),
                            ],
                        },
                    },
                },
            ]);

            res.status(200).json({
                activitiesTicketInfo: activitiesTicketInfo[0],
                skip: Number(skip),
                limit: Number(limit),
            });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },
};
