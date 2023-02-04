const { isValidObjectId, Types } = require("mongoose");

const { sendErrorResponse } = require("../../helpers");
const { RoomType, HotelContract, Hotel } = require("../../models");
const getDates = require("../../utils/getDates");
const {
    hotelContractSchema,
} = require("../validations/admHotelContract.schema");

module.exports = {
    updateHotelContract: async (req, res) => {
        try {
            const { dateFrom, dateTo, roomType, price, contractType } =
                req.body;

            const { _, error } = hotelContractSchema.validate(req.body);
            if (error) {
                return sendErrorResponse(res, 400, error.details[0].message);
            }

            if (!isValidObjectId(roomType)) {
                return sendErrorResponse(res, 400, "invalid room type id");
            }

            const roomTypeDetails = await RoomType.findOne({
                _id: roomType,
                isDeleted: false,
            });
            if (!roomTypeDetails) {
                return sendErrorResponse(res, 400, "room type not found");
            }

            const dates = getDates(dateFrom, dateTo);
            for (let i = 0; i < dates.length; i++) {
                const newHotelContract = new HotelContract({
                    hotel: roomTypeDetails.hotel,
                    roomType,
                    date: dates[i],
                    price,
                    contractType,
                });
                await newHotelContract.save();
            }

            res.status(200).json({ message: "contract successfully updated" });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    getSingleMonthHotelContract: async (req, res) => {
        try {
            const { id, month, year } = req.params;

            const totalDays = new Date(
                Number(year),
                Number(month),
                0
            ).getDate();

            let dummyDates = [];
            for (let i = 1; i <= totalDays; i++) {
                dummyDates.push(i);
            }

            const hotel = await Hotel.findOne({
                _id: id,
                isDeleted: false,
            })
                .populate("destination")
                .populate("roomTypes", "roomName")
                .lean();

            if (!hotel) {
                return sendErrorResponse(res, 404, "hotel not found");
            }

            const roomTypes = await RoomType.aggregate([
                { $match: { hotel: Types.ObjectId(id) } },
                {
                    $lookup: {
                        from: "hotelcontracts",
                        localField: "_id",
                        foreignField: "roomType",
                        as: "contracts",
                    },
                },
                { $unwind: "$contracts" },
                {
                    $project: {
                        contracts: {
                            year: { $year: "$contracts.date" },
                            month: { $month: "$contracts.date" },
                            day: { $dayOfMonth: "$contracts.date" },
                            contractType: 1,
                        },
                        _id: 1,
                        roomName: 1,
                    },
                },
                {
                    $group: {
                        _id: "$_id",
                        roomName: { $first: "$roomName" },
                        contracts: { $push: "$contracts" },
                    },
                },
                {
                    $project: {
                        roomName: 1,
                        contracts: {
                            $filter: {
                                input: "$contracts",
                                as: "contract",
                                cond: {
                                    $and: [
                                        {
                                            $eq: [
                                                "$$contract.year",
                                                Number(year),
                                            ],
                                        },
                                        {
                                            $eq: [
                                                "$$contract.month",
                                                Number(month),
                                            ],
                                        },
                                    ],
                                },
                            },
                        },
                    },
                },
                {
                    $project: {
                        roomName: 1,
                        contracts: {
                            $map: {
                                input: dummyDates,
                                as: "date",
                                in: {
                                    $let: {
                                        vars: {
                                            dateIndex: {
                                                $indexOfArray: [
                                                    "$contracts.day",
                                                    "$$date",
                                                ],
                                            },
                                        },
                                        in: {
                                            $cond: {
                                                if: {
                                                    $ne: ["$$dateIndex", -1],
                                                },
                                                then: {
                                                    $arrayElemAt: [
                                                        "$contracts",
                                                        "$$dateIndex",
                                                    ],
                                                },
                                                else: {
                                                    _id: "",
                                                    day: "$$date",
                                                    month: Number(month),
                                                    year: Number(year),
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            ]);

            res.status(200).json({
                hotel,
                roomTypes,
                dates: dummyDates,
            });
        } catch (err) {
            sendErrorResponse(res, 400, err);
        }
    },
};
