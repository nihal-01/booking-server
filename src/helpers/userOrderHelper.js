const { Types, isValidObjectId } = require("mongoose");
const xl = require("excel4node");

const { AttractionOrder } = require("../models");

module.exports = {
    getUserOrder: async ({
        skip = 0,
        limit = 10,
        bookingType,
        orderedBy,
        userId,
        status,
        referenceNo,
        dateFrom,
        dateTo,
        attraction,
        activity,
        travellerEmail,
    }) => {
        try {
            const filters1 = {
                "activities.status": {
                    $in: ["pending", "booked", "confirmed", "cancelled"],
                },
            };
            const filters2 = {};

            if (userId) {
                filters1.user = Types.ObjectId(userId);
            }

            if (bookingType && bookingType != "") {
                filters1["activities.bookingType"] = bookingType;
            }

            if (referenceNo && referenceNo !== "") {
                filters1.referenceNumber = referenceNo;
            }

            if (status && status !== "") {
                filters1["activities.status"] = status;
            }

            // if (orderedBy && orderedBy !== "") {
            //   filters1.orderedBy = orderedBy;
            // }

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
                    $lookup: {
                        from: "users",
                        localField: "user",
                        foreignField: "_id",
                        as: "user",
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
                        user: { $arrayElemAt: ["$user", 0] },
                        "activities.driver": {
                            $arrayElemAt: ["$activities.driver", 0],
                        },
                    },
                },
                {
                    $lookup: {
                        from: "destinations",
                        localField: "attraction.destination",
                        foreignField: "_id",
                        as: "activities.destination",
                    },
                },
                {
                    $set: {
                        "activities.destination": {
                            $arrayElemAt: ["$activities.destination", 0],
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
                            logo: 1,
                        },
                        activities: {
                            activity: {
                                name: 1,
                                description: 1,
                            },
                            destination: {
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

            return {
                result: orders[0],
                skip: Number(skip),
                limit: Number(limit),
            };
        } catch (err) {
            throw err;
        }
    },

    // generateB2bOrdersSheet: async ({
    //     skip = 0,
    //     limit = 10,
    //     bookingType,
    //     orderedBy,
    //     status,
    //     referenceNo,
    //     resellerId,
    //     agentCode,
    //     dateFrom,
    //     dateTo,
    //     attraction,
    //     activity,
    //     travellerEmail,
    //     res,
    // }) => {
    //     try {
    //         const filters1 = {
    //             "activities.status": {
    //                 $in: ["pending", "booked", "confirmed", "cancelled"],
    //             },
    //         };
    //         const filters2 = {};

    //         if (resellerId) {
    //             filters1.reseller = Types.ObjectId(resellerId);
    //         }

    //         if (bookingType && bookingType != "") {
    //             filters1["activities.bookingType"] = bookingType;
    //         }

    //         if (referenceNo && referenceNo !== "") {
    //             filters1.referenceNumber = referenceNo;
    //         }

    //         if (status && status !== "") {
    //             filters1["activities.status"] = status;
    //         }

    //         if (orderedBy && orderedBy !== "") {
    //             filters1.orderedBy = orderedBy;
    //         }

    //         if (travellerEmail && travellerEmail !== "") {
    //             filters1.email = travellerEmail;
    //         }

    //         if (agentCode && agentCode !== "") {
    //             filters2["reseller.agentCode"] = Number(agentCode);
    //         }

    //         if (dateFrom && dateFrom !== "" && dateTo && dateTo !== "") {
    //             filters1.$and = [
    //                 { "activities.date": { $gte: new Date(dateFrom) } },
    //                 { "activities.date": { $lte: new Date(dateTo) } },
    //             ];
    //         } else if (dateFrom && dateFrom !== "") {
    //             filters1["activities.date"] = { $gte: new Date(dateFrom) };
    //         } else if (dateTo && dateTo !== "") {
    //             filters1["activities.date"] = { $lte: new Date(dateTo) };
    //         }

    //         if (attraction && attraction !== "") {
    //             if (isValidObjectId(attraction)) {
    //                 filters2["attraction._id"] = Types.ObjectId(attraction);
    //             } else {
    //                 filters2["attraction.title"] = {
    //                     $regex: attraction,
    //                     $options: "i",
    //                 };
    //             }
    //         }

    //         if (activity && activity !== "") {
    //             if (isValidObjectId(activity)) {
    //                 filters2["activities.activity._id"] =
    //                     Types.ObjectId(activity);
    //             } else {
    //                 filters2["activities.activity.name"] = {
    //                     $regex: activity,
    //                     $options: "i",
    //                 };
    //             }
    //         }

    //         const orders = await AttractionOrd.aggregate([
    //             {
    //                 $unwind: "$activities",
    //             },
    //             { $match: filters1 },
    //             {
    //                 $lookup: {
    //                     from: "attractionactivities",
    //                     localField: "activities.activity",
    //                     foreignField: "_id",
    //                     as: "activities.activity",
    //                 },
    //             },
    //             {
    //                 $lookup: {
    //                     from: "attractions",
    //                     localField: "activities.activity.attraction",
    //                     foreignField: "_id",
    //                     as: "attraction",
    //                 },
    //             },
    //             {
    //                 $lookup: {
    //                     from: "countries",
    //                     localField: "country",
    //                     foreignField: "_id",
    //                     as: "country",
    //                 },
    //             },
    //             {
    //                 $lookup: {
    //                     from: "drivers",
    //                     localField: "activities.driver",
    //                     foreignField: "_id",
    //                     as: "activities.driver",
    //                 },
    //             },
    //             {
    //                 $lookup: {
    //                     from: "resellers",
    //                     localField: "reseller",
    //                     foreignField: "_id",
    //                     as: "reseller",
    //                 },
    //             },
    //             {
    //                 $set: {
    //                     "activities.activity": {
    //                         $arrayElemAt: ["$activities.activity", 0],
    //                     },
    //                     attraction: {
    //                         $arrayElemAt: ["$attraction", 0],
    //                     },
    //                     country: { $arrayElemAt: ["$country", 0] },
    //                     reseller: { $arrayElemAt: ["$reseller", 0] },
    //                     "activities.driver": {
    //                         $arrayElemAt: ["$activities.driver", 0],
    //                     },
    //                 },
    //             },
    //             { $match: filters2 },
    //             {
    //                 $project: {
    //                     totalOffer: 1,
    //                     totalAmount: 1,
    //                     name: 1,
    //                     email: 1,
    //                     phoneNumber: 1,
    //                     country: 1,
    //                     orderStatus: 1,
    //                     merchant: 1,
    //                     paymentStatus: 1,
    //                     paymentOrderId: 1,
    //                     createdAt: 1,
    //                     updatedAt: 1,
    //                     attraction: {
    //                         title: 1,
    //                         images: 1,
    //                     },
    //                     activities: {
    //                         activity: {
    //                             name: 1,
    //                         },
    //                         bookingType: 1,
    //                         date: 1,
    //                         adultsCount: 1,
    //                         childrenCount: 1,
    //                         infantCount: 1,
    //                         adultCost: 1,
    //                         childCost: 1,
    //                         transferType: 1,
    //                         offerAmount: 1,
    //                         amount: 1,
    //                         adultTickets: 1,
    //                         childTickets: 1,
    //                         status: 1,
    //                         isRefunded: 1,
    //                         profit: 1,
    //                         bookingConfirmationNumber: 1,
    //                         driver: 1,
    //                         _id: 1,
    //                     },
    //                     reseller: {
    //                         companyName: 1,
    //                         website: 1,
    //                         email: 1,
    //                         agentCode: 1,
    //                     },
    //                     referenceNumber: 1,
    //                 },
    //             },
    //             { $sort: { createdAt: -1 } },
    //             {
    //                 $skip: Number(limit) * Number(skip),
    //             },
    //             {
    //                 $limit: Number(limit),
    //             },
    //         ]);

    //         var wb = new xl.Workbook();
    //         var ws = wb.addWorksheet("Orders");

    //         const titleStyle = wb.createStyle({
    //             font: {
    //                 bold: true,
    //             },
    //         });

    //         ws.cell(1, 1).string("Ref No").style(titleStyle);
    //         ws.cell(1, 2).string("Activity").style(titleStyle);
    //         ws.cell(1, 3).string("Ordered By").style(titleStyle);
    //         ws.cell(1, 4).string("Purchase Date").style(titleStyle);
    //         ws.cell(1, 5).string("Booking Date").style(titleStyle);
    //         ws.cell(1, 6).string("Traveller Name").style(titleStyle);
    //         ws.cell(1, 7).string("Traveller Email").style(titleStyle);
    //         ws.cell(1, 8).string("Traveller Country").style(titleStyle);
    //         ws.cell(1, 9).string("Traveller Phone Number").style(titleStyle);
    //         ws.cell(1, 10).string("Adults").style(titleStyle);
    //         ws.cell(1, 11).string("Children").style(titleStyle);
    //         ws.cell(1, 12).string("Infant").style(titleStyle);
    //         ws.cell(1, 13).string("Transfer Type").style(titleStyle);
    //         ws.cell(1, 14).string("Driver").style(titleStyle);
    //         if (bookingType === "ticket") {
    //             ws.cell(1, 15).string("Tickets").style(titleStyle);
    //         } else {
    //             ws.cell(1, 15)
    //                 .string("Booking Confirmation No")
    //                 .style(titleStyle);
    //         }
    //         ws.cell(1, 16).string("Price").style(titleStyle);
    //         ws.cell(1, 17).string("Profit").style(titleStyle);
    //         ws.cell(1, 18).string("Status").style(titleStyle);

    //         for (let i = 0; i < orders.length; i++) {
    //             const order = orders[i];
    //             ws.cell(i + 2, 1).string(order?.referenceNumber || "N/A");
    //             ws.cell(i + 2, 2).string(
    //                 order?.activities?.activity?.name || "N/A"
    //             );
    //             ws.cell(i + 2, 3).string(order?.reseller?.companyName || "N/A");
    //             ws.cell(i + 2, 4).string(
    //                 new Date(order?.createdAt).toDateString() || "N/A"
    //             );
    //             ws.cell(i + 2, 5).string(
    //                 new Date(order?.activities?.date).toDateString() || "N/A"
    //             );
    //             ws.cell(i + 2, 6).string(order?.name || "N/A");
    //             ws.cell(i + 2, 7).string(order?.email || "N/A");
    //             ws.cell(i + 2, 8).string(order?.country?.countryName || "N/A");
    //             ws.cell(i + 2, 9).string(
    //                 order?.country?.phonecode + " " + order?.phoneNumber ||
    //                     "N/A"
    //             );
    //             ws.cell(i + 2, 10).number(
    //                 Number(order?.activities?.adultsCount) || 0
    //             );
    //             ws.cell(i + 2, 11).number(
    //                 Number(order?.activities?.childrenCount) || 0
    //             );
    //             ws.cell(i + 2, 12).number(
    //                 Number(order?.activities?.infantCount) || 0
    //             );
    //             ws.cell(i + 2, 13).string(
    //                 order?.activities?.transferType || "N/A"
    //             );
    //             ws.cell(i + 2, 14).string(
    //                 order?.activities?.driver?.name || "N/A"
    //             );
    //             if (bookingType === "ticket") {
    //                 let adultTickets = order?.activities?.adultTickets
    //                     ? order?.activities?.adultTickets?.map(
    //                           (ticket) => ticket?.ticketNo
    //                       )
    //                     : [];
    //                 let childTickets = order?.activities?.childTickets
    //                     ? order?.activities?.childTickets?.map(
    //                           (ticket) => ticket?.ticketNo
    //                       )
    //                     : [];
    //                 let infantTickets = order?.activities?.infantTickets
    //                     ? order?.activities?.infantTickets?.map(
    //                           (ticket) => ticket?.ticketNo
    //                       )
    //                     : [];
    //                 let allTickets = [
    //                     ...adultTickets,
    //                     ...childTickets,
    //                     ...infantTickets,
    //                 ];
    //                 ws.cell(i + 2, 15).string(
    //                     JSON.stringify(allTickets) || "N/A"
    //                 );
    //             } else {
    //                 ws.cell(i + 2, 15).string(
    //                     order?.activities?.bookingConfirmationNumber || "N/A"
    //                 );
    //             }
    //             ws.cell(i + 2, 16).number(
    //                 Number(order?.activities?.amount) || 0
    //             );
    //             ws.cell(i + 2, 17).number(
    //                 Number(order?.activities?.profit) || 0
    //             );
    //             ws.cell(i + 2, 18).string(order?.activities?.status || "N/A");
    //         }

    //         wb.write(`FileName.xlsx`, res);
    //     } catch (err) {
    //         throw err;
    //     }
    // },
};
