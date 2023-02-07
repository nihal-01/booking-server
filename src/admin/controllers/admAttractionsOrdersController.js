const { isValidObjectId } = require("mongoose");
const xl = require("excel4node");

const {
    handleAttractionOrderMarkup,
} = require("../../b2b/helpers/attractionOrderHelpers");
const { B2BAttractionOrder } = require("../../b2b/models");
const { sendErrorResponse } = require("../../helpers");
const { AttractionOrder, Driver } = require("../../models");
const {
    getB2bOrders,
    generateB2bOrdersSheet,
} = require("../../b2b/helpers/b2bOrdersHelper");

module.exports = {
    getAllB2cOrders: async (req, res) => {
        try {
            const {
                skip = 0,
                limit = 10,
                bookingType,
                status,
                referenceNo,
                dateFrom,
                dateTo,
                attraction,
                activity,
                travellerEmail,
            } = req.query;

            const filters1 = {
                "activities.status": {
                    $in: ["booked", "confirmed", "cancelled", "pending"],
                },
            };
            const filters2 = {};

            if (bookingType && bookingType != "") {
                filters1["activities.bookingType"] = bookingType;
            }

            if (referenceNo && referenceNo !== "") {
                filters1.referenceNumber = referenceNo;
            }

            if (status && status !== "") {
                filters1["activities.status"] = status;
            }

            if (travellerEmail && travellerEmail !== "") {
                filters1.email = travellerEmail;
            }

            if (dateFrom && dateFrom !== "" && dateTo && dateTo !== "") {
                filters1.$and = [
                    { "activities.date": { $gte: new Date(dateFrom) } },
                    { "activities.date": { $lte: new Date(dateTo) } },
                ];
            } else if (dateFrom && dateFrom !== "") {
                filters1["activities.date"] = { $gte: new Date(dateFrom) };
            } else if (dateTo && dateTo !== "") {
                filters1["activities.date"] = { $lte: new Date(dateTo) };
            }

            if (attraction && attraction !== "") {
                if (isValidObjectId(attraction)) {
                    filters2["attraction._id"] = Types.ObjectId(attraction);
                } else {
                    filters2["attraction.title"] = {
                        $regex: attraction,
                        $options: "i",
                    };
                }
            }

            if (activity && activity !== "") {
                if (isValidObjectId(activity)) {
                    filters2["activities.activity._id"] =
                        Types.ObjectId(activity);
                } else {
                    filters2["activities.activity.name"] = {
                        $regex: activity,
                        $options: "i",
                    };
                }
            }

            const orders = await AttractionOrder.aggregate([
                {
                    $unwind: "$activities",
                },
                { $match: filters1 },
                {
                    $lookup: {
                        from: "attractionactivities",
                        localField: "activities.activity",
                        foreignField: "_id",
                        as: "activities.activity",
                    },
                },
                {
                    $lookup: {
                        from: "attractions",
                        localField: "activities.activity.attraction",
                        foreignField: "_id",
                        as: "attraction",
                    },
                },
                {
                    $lookup: {
                        from: "countries",
                        localField: "country",
                        foreignField: "_id",
                        as: "country",
                    },
                },
                {
                    $lookup: {
                        from: "drivers",
                        localField: "activities.driver",
                        foreignField: "_id",
                        as: "activities.driver",
                    },
                },
                {
                    $set: {
                        "activities.activity": {
                            $arrayElemAt: ["$activities.activity", 0],
                        },
                        attraction: {
                            $arrayElemAt: ["$attraction", 0],
                        },
                        country: { $arrayElemAt: ["$country", 0] },
                        "activities.driver": {
                            $arrayElemAt: ["$activities.driver", 0],
                        },
                    },
                },
                { $match: filters2 },
                { $sort: { createdAt: -1 } },
                {
                    $project: {
                        totalOffer: 1,
                        totalAmount: 1,
                        name: 1,
                        email: 1,
                        phoneNumber: 1,
                        country: 1,
                        orderStatus: 1,
                        merchant: 1,
                        paymentStatus: 1,
                        paymentOrderId: 1,
                        createdAt: 1,
                        updatedAt: 1,
                        attraction: {
                            title: 1,
                            images: 1,
                        },
                        activities: {
                            activity: {
                                name: 1,
                            },
                            bookingType: 1,
                            date: 1,
                            adultsCount: 1,
                            childrenCount: 1,
                            infantCount: 1,
                            adultCost: 1,
                            childCost: 1,
                            transferType: 1,
                            offerAmount: 1,
                            amount: 1,
                            adultTickets: 1,
                            childTickets: 1,
                            status: 1,
                            isRefunded: 1,
                            profit: 1,
                            bookingConfirmationNumber: 1,
                            driver: 1,
                            _id: 1,
                        },
                        referenceNumber: 1,
                    },
                },
                {
                    $group: {
                        _id: null,
                        totalOrders: { $sum: 1 },
                        data: { $push: "$$ROOT" },
                    },
                },
                {
                    $project: {
                        totalOrders: 1,
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
                result: orders[0],
                skip: Number(skip),
                limit: Number(limit),
            });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    getAllB2cOrdersSheet: async (req, res) => {
        try {
            const {
                skip = 0,
                limit = 10,
                bookingType,
                status,
                referenceNo,
                dateFrom,
                dateTo,
                attraction,
                activity,
                travellerEmail,
            } = req.query;

            const filters1 = {
                "activities.status": {
                    $in: ["booked", "confirmed", "cancelled", "pending"],
                },
            };
            const filters2 = {};

            if (bookingType && bookingType != "") {
                filters1["activities.bookingType"] = bookingType;
            }

            if (referenceNo && referenceNo !== "") {
                filters1.referenceNumber = referenceNo;
            }

            if (status && status !== "") {
                filters1["activities.status"] = status;
            }

            if (travellerEmail && travellerEmail !== "") {
                filters1.email = travellerEmail;
            }

            if (dateFrom && dateFrom !== "" && dateTo && dateTo !== "") {
                filters1.$and = [
                    { "activities.date": { $gte: new Date(dateFrom) } },
                    { "activities.date": { $lte: new Date(dateTo) } },
                ];
            } else if (dateFrom && dateFrom !== "") {
                filters1["activities.date"] = { $gte: new Date(dateFrom) };
            } else if (dateTo && dateTo !== "") {
                filters1["activities.date"] = { $lte: new Date(dateTo) };
            }

            if (attraction && attraction !== "") {
                if (isValidObjectId(attraction)) {
                    filters2["attraction._id"] = Types.ObjectId(attraction);
                } else {
                    filters2["attraction.title"] = {
                        $regex: attraction,
                        $options: "i",
                    };
                }
            }

            if (activity && activity !== "") {
                if (isValidObjectId(activity)) {
                    filters2["activities.activity._id"] =
                        Types.ObjectId(activity);
                } else {
                    filters2["activities.activity.name"] = {
                        $regex: activity,
                        $options: "i",
                    };
                }
            }

            const orders = await AttractionOrder.aggregate([
                {
                    $unwind: "$activities",
                },
                { $match: filters1 },
                {
                    $lookup: {
                        from: "attractionactivities",
                        localField: "activities.activity",
                        foreignField: "_id",
                        as: "activities.activity",
                    },
                },
                {
                    $lookup: {
                        from: "attractions",
                        localField: "activities.activity.attraction",
                        foreignField: "_id",
                        as: "attraction",
                    },
                },
                {
                    $lookup: {
                        from: "countries",
                        localField: "country",
                        foreignField: "_id",
                        as: "country",
                    },
                },
                {
                    $lookup: {
                        from: "drivers",
                        localField: "activities.driver",
                        foreignField: "_id",
                        as: "activities.driver",
                    },
                },
                {
                    $set: {
                        "activities.activity": {
                            $arrayElemAt: ["$activities.activity", 0],
                        },
                        attraction: {
                            $arrayElemAt: ["$attraction", 0],
                        },
                        country: { $arrayElemAt: ["$country", 0] },
                        "activities.driver": {
                            $arrayElemAt: ["$activities.driver", 0],
                        },
                    },
                },
                { $match: filters2 },
                { $sort: { createdAt: -1 } },
                {
                    $project: {
                        totalOffer: 1,
                        totalAmount: 1,
                        name: 1,
                        email: 1,
                        phoneNumber: 1,
                        country: 1,
                        orderStatus: 1,
                        merchant: 1,
                        paymentStatus: 1,
                        paymentOrderId: 1,
                        createdAt: 1,
                        updatedAt: 1,
                        attraction: {
                            title: 1,
                            images: 1,
                        },
                        activities: {
                            activity: {
                                name: 1,
                            },
                            bookingType: 1,
                            date: 1,
                            adultsCount: 1,
                            childrenCount: 1,
                            infantCount: 1,
                            adultCost: 1,
                            childCost: 1,
                            transferType: 1,
                            offerAmount: 1,
                            amount: 1,
                            adultTickets: 1,
                            childTickets: 1,
                            status: 1,
                            isRefunded: 1,
                            profit: 1,
                            bookingConfirmationNumber: 1,
                            driver: 1,
                            _id: 1,
                        },
                        referenceNumber: 1,
                    },
                },
                {
                    $skip: Number(limit) * Number(skip),
                },
                {
                    $limit: Number(limit),
                },
            ]);

            var wb = new xl.Workbook();
            var ws = wb.addWorksheet("Orders");

            const titleStyle = wb.createStyle({
                font: {
                    bold: true,
                },
            });

            ws.cell(1, 1).string("Ref No").style(titleStyle);
            ws.cell(1, 2).string("Activity").style(titleStyle);
            ws.cell(1, 3).string("Purchase Date").style(titleStyle);
            ws.cell(1, 4).string("Booking Date").style(titleStyle);
            ws.cell(1, 5).string("Traveller Name").style(titleStyle);
            ws.cell(1, 6).string("Traveller Email").style(titleStyle);
            ws.cell(1, 7).string("Traveller Country").style(titleStyle);
            ws.cell(1, 8).string("Traveller Phone Number").style(titleStyle);
            ws.cell(1, 9).string("Adults").style(titleStyle);
            ws.cell(1, 10).string("Children").style(titleStyle);
            ws.cell(1, 11).string("Infant").style(titleStyle);
            ws.cell(1, 12).string("Transfer Type").style(titleStyle);
            ws.cell(1, 13).string("Driver").style(titleStyle);
            if (bookingType === "ticket") {
                ws.cell(1, 14).string("Tickets").style(titleStyle);
            } else {
                ws.cell(1, 14)
                    .string("Booking Confirmation No")
                    .style(titleStyle);
            }
            ws.cell(1, 15).string("Price").style(titleStyle);
            ws.cell(1, 16).string("Profit").style(titleStyle);
            ws.cell(1, 17).string("Status").style(titleStyle);

            for (let i = 0; i < orders.length; i++) {
                const order = orders[i];
                ws.cell(i + 2, 1).string(order?.referenceNumber || "N/A");
                ws.cell(i + 2, 2).string(
                    order?.activities?.activity?.name || "N/A"
                );
                ws.cell(i + 2, 3).string(
                    new Date(order?.createdAt).toDateString() || "N/A"
                );
                ws.cell(i + 2, 4).string(
                    new Date(order?.activities?.date).toDateString() || "N/A"
                );
                ws.cell(i + 2, 5).string(order?.name || "N/A");
                ws.cell(i + 2, 6).string(order?.email || "N/A");
                ws.cell(i + 2, 7).string(order?.country?.countryName || "N/A");
                ws.cell(i + 2, 8).string(
                    order?.country?.phonecode + " " + order?.phoneNumber ||
                        "N/A"
                );
                ws.cell(i + 2, 9).number(
                    Number(order?.activities?.adultsCount) || 0
                );
                ws.cell(i + 2, 10).number(
                    Number(order?.activities?.childrenCount) || 0
                );
                ws.cell(i + 2, 11).number(
                    Number(order?.activities?.infantCount) || 0
                );
                ws.cell(i + 2, 12).string(
                    order?.activities?.transferType || "N/A"
                );
                ws.cell(i + 2, 13).string(
                    order?.activities?.driver?.name || "N/A"
                );
                if (bookingType === "ticket") {
                    let adultTickets = order?.activities?.adultTickets
                        ? order?.activities?.adultTickets?.map(
                              (ticket) => ticket?.ticketNo
                          )
                        : [];
                    let childTickets = order?.activities?.childTickets
                        ? order?.activities?.childTickets?.map(
                              (ticket) => ticket?.ticketNo
                          )
                        : [];
                    let infantTickets = order?.activities?.infantTickets
                        ? order?.activities?.infantTickets?.map(
                              (ticket) => ticket?.ticketNo
                          )
                        : [];
                    let allTickets = [
                        ...adultTickets,
                        ...childTickets,
                        ...infantTickets,
                    ];
                    ws.cell(i + 2, 14).string(
                        JSON.stringify(allTickets) || "N/A"
                    );
                } else {
                    ws.cell(i + 2, 14).string(
                        order?.activities?.bookingConfirmationNumber || "N/A"
                    );
                }
                ws.cell(i + 2, 15).number(
                    Number(order?.activities?.amount) || 0
                );
                ws.cell(i + 2, 16).number(
                    Number(order?.activities?.profit) || 0
                );
                ws.cell(i + 2, 17).string(order?.activities?.status || "N/A");
            }

            wb.write(`FileName.xlsx`, res);
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    getAllB2bOrders: async (req, res) => {
        try {
            const { result, skip, limit } = await getB2bOrders({
                ...req.query,
            });

            res.status(200).json({ result, skip, limit });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    confirmBooking: async (req, res) => {
        try {
            const {
                orderId,
                bookingId,
                bookingConfirmationNumber,
                driver,
                orderedBy,
            } = req.body;

            if (!isValidObjectId(orderId)) {
                return sendErrorResponse(res, 400, "invalid order id");
            }

            if (!isValidObjectId(bookingId)) {
                return sendErrorResponse(res, 400, "invalid booking id");
            }

            let orderDetails;
            if (orderedBy === "b2c") {
                orderDetails = await AttractionOrder.findOne(
                    {
                        _id: orderId,
                    },
                    { activities: { $elemMatch: { _id: bookingId } } }
                );
            } else {
                orderDetails = await B2BAttractionOrder.findOne(
                    {
                        _id: orderId,
                    },
                    { activities: { $elemMatch: { _id: bookingId } } }
                );
            }

            if (!orderDetails || orderDetails?.activities[0]?.length < 1) {
                return sendErrorResponse(res, 400, "Order not found");
            }

            if (orderDetails.activities[0]?.bookingType !== "booking") {
                return sendErrorResponse(
                    res,
                    400,
                    "Only bookings can confirmed!"
                );
            }

            if (orderDetails.activities[0].status !== "booked") {
                return sendErrorResponse(
                    res,
                    400,
                    "You can't confirm this booking. because this order not booked or cancelled or already confirmed"
                );
            }

            if (
                orderDetails?.activities[0]?.transferType !== "without" &&
                !driver
            ) {
                return sendErrorResponse(res, 400, "Driver is required");
            }

            let driverDetails;
            if (orderDetails?.activities[0]?.transferType !== "without") {
                if (!isValidObjectId(driver)) {
                    return sendErrorResponse(res, 400, "Invalid driver id");
                }

                driverDetails = await Driver.findOne({
                    _id: driver,
                    isDeleted: false,
                });
                if (!driverDetails) {
                    return sendErrorResponse(res, 404, "Driver not found");
                }
            }

            if (orderedBy === "b2c") {
                await AttractionOrder.findOneAndUpdate(
                    {
                        _id: orderId,
                        "activities._id": bookingId,
                    },
                    {
                        "activities.$.status": "confirmed",
                        "activities.$.bookingConfirmationNumber":
                            bookingConfirmationNumber,
                        "activities.$.driver":
                            orderDetails?.activities[0]?.transferType !==
                            "without"
                                ? driver
                                : undefined,
                    },
                    { runValidators: true }
                );
            } else {
                await B2BAttractionOrder.findOneAndUpdate(
                    {
                        _id: orderId,
                        "activities._id": bookingId,
                    },
                    {
                        "activities.$.status": "confirmed",
                        "activities.$.bookingConfirmationNumber":
                            bookingConfirmationNumber,
                        "activities.$.driver":
                            orderDetails?.activities[0]?.transferType !==
                            "without"
                                ? driver
                                : undefined,
                    },
                    { runValidators: true }
                );

                await handleAttractionOrderMarkup(
                    orderId,
                    orderDetails?.activities[0]
                );
            }

            res.status(200).json({
                message: "Booking confirmed successfully",
                bookingConfirmationNumber,
                driver: driverDetails,
            });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    cancelBooking: async (req, res) => {
        try {
            const { orderId, bookingId, orderedBy } = req.body;

            if (!isValidObjectId(orderId)) {
                return sendErrorResponse(res, 400, "Invalid order id");
            }

            if (!isValidObjectId(bookingId)) {
                return sendErrorResponse(res, 400, "Invalid booking id");
            }

            let orderDetails;
            if (orderedBy === "b2c") {
                orderDetails = await AttractionOrder.findOne(
                    {
                        _id: orderId,
                    },
                    { activities: { $elemMatch: { _id: bookingId } } }
                );
            } else {
                orderDetails = await B2BAttractionOrder.findOne(
                    {
                        _id: orderId,
                    },
                    { activities: { $elemMatch: { _id: bookingId } } }
                );
            }

            if (!orderDetails || orderDetails?.activities?.length < 1) {
                return sendErrorResponse(res, 400, "Order not found");
            }

            if (orderDetails.activities[0]?.bookingType !== "booking") {
                return sendErrorResponse(
                    res,
                    400,
                    "Only bookings can cancelled!"
                );
            }

            if (orderDetails.activities[0].status !== "booked") {
                return sendErrorResponse(
                    res,
                    400,
                    "You cantn't canel this booking."
                );
            }

            if (orderedBy === "b2c") {
                await AttractionOrder.findOneAndUpdate(
                    {
                        _id: orderId,
                        "activities._id": bookingId,
                    },
                    {
                        "activities.$.status": "cancelled",
                    },
                    { runValidators: true }
                );
            } else {
                await B2BAttractionOrder.findOneAndUpdate(
                    {
                        _id: orderId,
                        "activities._id": bookingId,
                    },
                    {
                        "activities.$.status": "cancelled",
                    },
                    { runValidators: true }
                );
            }

            // send email and refund balance

            res.status(200).json({
                message: "Booking cancelled successfully",
            });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    updateDriverForOrder: async (req, res) => {
        try {
            const { orderId, orderItemId, driver, orderedBy } = req.body;

            if (!isValidObjectId(orderId)) {
                return sendErrorResponse(res, 400, "Invalid order id");
            }

            if (!isValidObjectId(orderItemId)) {
                return sendErrorResponse(res, 400, "Invalid order item id");
            }

            if (!isValidObjectId(driver)) {
                return sendErrorResponse(res, 400, "Invalid Driver id");
            }

            let orderDetails;
            if (orderedBy === "b2c") {
                orderDetails = await AttractionOrder.findOne(
                    {
                        _id: orderId,
                    },
                    { activities: { $elemMatch: { _id: orderItemId } } }
                );
            } else {
                orderDetails = await B2BAttractionOrder.findOne(
                    {
                        _id: orderId,
                    },
                    { activities: { $elemMatch: { _id: orderItemId } } }
                );
            }

            if (!orderDetails || orderDetails?.activities?.length < 1) {
                return sendErrorResponse(res, 400, "Order not found");
            }

            if (orderDetails.activities[0].status !== "confirmed") {
                return sendErrorResponse(
                    res,
                    400,
                    "You can only assign driver for confirmed orders"
                );
            }

            if (orderDetails?.activities[0]?.transferType === "without") {
                return sendErrorResponse(
                    res,
                    400,
                    "Sorry, This order has no transfer"
                );
            }

            const driverDetails = await Driver.findOne({
                _id: driver,
                isDeleted: false,
            });
            if (!driverDetails) {
                return sendErrorResponse(res, 404, "Driver not found");
            }

            if (orderedBy === "b2c") {
                await AttractionOrder.findOneAndUpdate(
                    {
                        _id: orderId,
                        "activities._id": orderItemId,
                    },
                    {
                        "activities.$.driver": driver,
                    },
                    { runValidators: true }
                );
            } else {
                await B2BAttractionOrder.findOneAndUpdate(
                    {
                        _id: orderId,
                        "activities._id": orderItemId,
                    },
                    {
                        "activities.$.driver": driver,
                    },
                    { runValidators: true }
                );
            }

            // send mail here

            res.status(200).json({ driver: driverDetails });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    getSingleResellerAttractionOrders: async (req, res) => {
        try {
            const { resellerId } = req.params;

            if (!isValidObjectId(resellerId)) {
                return sendErrorResponse(res, 400, "invalid reseller id");
            }

            const { result, skip, limit } = await getB2bOrders({
                ...req.query,
                resellerId,
            });

            res.status(200).json({ result, skip, limit });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    getB2bAllOrdersSheet: async (req, res) => {
        try {
            await generateB2bOrdersSheet({ ...req.query, res });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    getSingleResellerAttractionOrdersSheet: async (req, res) => {
        try {
            const { resellerId } = req.params;

            if (!isValidObjectId(resellerId)) {
                return sendErrorResponse(res, 400, "invalid reseller id");
            }

            await generateB2bOrdersSheet({ ...req.query, res, resellerId });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },
};
