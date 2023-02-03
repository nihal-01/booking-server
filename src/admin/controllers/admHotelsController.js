const { isValidObjectId } = require("mongoose");

const { sendErrorResponse } = require("../../helpers");
const { Hotel, HotelFacility, Destination } = require("../../models");
const { hotelSchema } = require("../validations/admHotelSchema");

module.exports = {
    uploadBulkHotels: async (req, res) => {
        try {
            if (!req.file) {
                return sendErrorResponse(res, 500, "csv file is required");
            }

            let csvRow = 0;
            let hotelsList = [];
            let newHotels;
            let hotelError;
            const uploadHotels = async () => {
                for (let i = 0; i < ticketsList?.length; i++) {
                    try {
                        newHotels = await Hotel.insertMany(hotelsList);
                    } catch (err) {
                        hotelError = err;
                    }
                }
            };

            fs.createReadStream(req.file?.path)
                .pipe(parse({ delimiter: "," }))
                .on("data", async function (csvrow) {
                    if (csvRow !== 0) {
                        hotelsList.push({
                            name: csvrow[0],
                            website: csvrow[1],
                            place: csvrow[2],
                            starCategory: csvrow[3],
                        });
                    }
                    csvRow += 1;
                })
                .on("end", async function () {
                    await uploadHotels();

                    if (hotelError) {
                        return sendErrorResponse(res, 400, hotelError);
                    }

                    res.status(200).json(newHotels);
                })
                .on("error", function (err) {
                    sendErrorResponse(
                        res,
                        400,
                        "something went wrong, wile parsing csv"
                    );
                });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    addNewHotel: async (req, res) => {
        try {
            const { destination, facilities, faqs, longitude, latitude } =
                req.body;

            const { _, error } = hotelSchema.validate({
                ...req.body,
                faqs: faqs ? JSON.parse(faqs) : [],
                facilities: facilities ? JSON.parse(facilities) : [],
            });
            if (error) {
                return sendErrorResponse(res, 400, error.details[0].message);
            }

            let images = [];
            for (let i = 0; i < req.files?.length; i++) {
                const img = "/" + req.files[i]?.path?.replace(/\\/g, "/");
                images.push(img);
            }

            let parsedFacilities;
            if (facilities) {
                parsedFacilities = JSON.parse(facilities);
            }

            let parsedFaqs;
            if (faqs) {
                parsedFaqs = JSON.parse(faqs);
            }

            const destinationDetails = await Destination.findOne({
                _id: destination,
                isDeleted: false,
            });
            if (!destinationDetails) {
                return sendErrorResponse(res, 404, "destination not found");
            }

            const newHotel = new Hotel({
                ...req.body,
                isPublished: true,
                images,
                country: destinationDetails?.country,
                faqs: parsedFaqs,
                facilities: parsedFacilities,
                geoCode: {
                    longitude,
                    latitude,
                },
            });
            await newHotel.save();

            res.status(200).json({
                message: "hotel uploaded successfully",
                _id: newHotel._id,
            });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    updateHotel: async (req, res) => {
        try {
            const { id } = req.params;
            const { oldImages } = req.body;

            const { _, error } = hotelSchema.validate(req.body);
            if (error) {
                return sendErrorResponse(res, 400, error.details[0].message);
            }

            if (!isValidObjectId(id)) {
                return sendErrorResponse(res, 400, "invalid hotel id");
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

            const hotel = await Hotel.findByIdAndUpdate(
                id,
                {
                    ...req.body,
                    images: newImages,
                },
                { runValidators: true }
            );

            if (!hotel) {
                return sendErrorResponse(res, 404, "hotel not found");
            }

            res.status(200).json({ message: "hotel successfully updated" });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    deleteHotel: async (req, res) => {
        try {
            const { id } = req.params;

            if (!isValidObjectId(id)) {
                return sendErrorResponse(res, 400, "invalid hotel id");
            }

            const hotel = await Hotel.findOneAndUpdate(
                { _id: id, isDeleted: false },
                { isDeleted: true }
            );

            if (!hotel) {
                return sendErrorResponse(
                    res,
                    404,
                    "hotel not found or already deleted"
                );
            }

            res.status(200).json({
                message: "hotel successfully deleted",
                _id: id,
            });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    getAllHotels: async (req, res) => {
        try {
            const { skip = 0, limit = 10 } = req.params;

            const hotels = await Hotel.find({ isDeleted: false })
                .populate("country destination")
                .sort({ createdAt: -1 })
                .limit(limit)
                .skip(limit * skip)
                .lean();

            const totalHotels = await Hotel.find({ isDeleted: false }).count();

            res.status(200).json({
                hotels,
                totalHotels,
                skip: Number(skip),
                limit: Number(limit),
            });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    getInitialData: async (req, res) => {
        try {
            const facilities = await HotelFacility.find({})
                .sort({
                    name: 1,
                })
                .collation({ locale: "en", caseLevel: true });

            res.status(200).json({ facilities });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },
};
