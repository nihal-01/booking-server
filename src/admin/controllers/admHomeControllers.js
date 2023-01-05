const { isValidObjectId } = require("mongoose");

const { sendErrorResponse } = require("../../helpers");
const { HomeSettings, Attraction } = require("../../models");
const {
    homeFooterSettingsSchema,
    homeHeroSettingsSchema,
    homeCardSettingsSchema,
    homeMetaSettingsSchema,
    homeSectionsSettingsSchema,
} = require("../validations/homeSettings.schema");

module.exports = {
    getLogo: async (req, res) => {
        try {
            const home = await HomeSettings.findOne({ settingsNumber: 1 });

            if (!home) {
                return sendErrorResponse(res, 404, "Home not found");
            }

            res.status(200).json({ logo: home?.logo });
        } catch (err) {
            console.log(err);
        }
    },

    updateHomeLogo: async (req, res) => {
        try {
            if (!req.file?.path) {
                return sendErrorResponse(res, 400, "Logo is required");
            }

            let logoImg;
            if (req.file?.path) {
                logoImg = "/" + req.file.path.replace(/\\/g, "/");
            }

            const homeSettings = await HomeSettings.findOneAndUpdate(
                { settingsNumber: 1 },
                {
                    logo: logoImg,
                },
                { runValidators: true, new: true, upsert: true }
            );

            res.status(200).json({ logo: homeSettings.logo });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    addHomeHeros: async (req, res) => {
        try {
            const { title, description, place } = req.body;

            const { _, error } = homeHeroSettingsSchema.validate(req.body);
            if (error) {
                return sendErrorResponse(res, 400, error.details[0].message);
            }

            if (!req.file) {
                return sendErrorResponse(res, 400, "Image is required");
            }

            let image;
            if (req.file?.path) {
                image = "/" + req.file.path.replace(/\\/g, "/");
            }

            const home = await HomeSettings.findOneAndUpdate(
                { settingsNumber: 1 },
                {
                    $push: { heros: { title, description, image, place } },
                },
                { upsert: true, new: true, runValidators: true }
            );

            res.status(200).json(home.heros[home.heros?.length - 1]);
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    updateHomeHero: async (req, res) => {
        try {
            const { heroId } = req.params;
            const { title, description, place } = req.body;

            const { _, error } = homeHeroSettingsSchema.validate(req.body);
            if (error) {
                return sendErrorResponse(res, 400, error.details[0].message);
            }

            if (!isValidObjectId(heroId)) {
                return sendErrorResponse(res, 400, "Invalid hero Id");
            }

            let image;
            if (req.file?.path) {
                image = "/" + req.file.path.replace(/\\/g, "/");
            }

            const home = await HomeSettings.findOneAndUpdate(
                {
                    settingsNumber: 1,
                    "heros._id": heroId,
                },
                {
                    "heros.$.title": title,
                    "heros.$.description": description,
                    "heros.$.place": place,
                    "heros.$.image": image,
                },
                { new: true, runValidators: true }
            );

            if (!home) {
                return sendErrorResponse(res, 400, "Hero not found");
            }

            const objIndex = home.heros?.findIndex((hero) => {
                return hero?._id?.toString() === heroId?.toString();
            });

            res.status(200).json(home.heros[objIndex]);
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    deleteHomeHero: async (req, res) => {
        try {
            const { heroId } = req.params;

            if (!isValidObjectId(heroId)) {
                return sendErrorResponse(res, 400, "Invalid Hero Id");
            }

            const home = await HomeSettings.findOneAndUpdate(
                { settingsNumber: 1, "heros._id": heroId },
                {
                    $pull: { heros: { _id: heroId } },
                },
                {
                    new: true,
                }
            );

            if (!home) {
                return sendErrorResponse(res, 404, "Hero not found");
            }

            res.status(200).json({
                message: "Hero successfully deleted",
                _id: heroId,
            });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    getAllCards: async (req, res) => {
        try {
            const home = await HomeSettings.findOne({ settingsNumber: 1 });

            if (!home) {
                return sendErrorResponse(res, 404, "Home not found");
            }

            res.status(200).json({ cards: home?.cards });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    addHomeCard: async (req, res) => {
        try {
            const { title, description, tag, url, isRelativeUrl } = req.body;

            const { _, error } = homeCardSettingsSchema.validate(req.body);
            if (error) {
                return sendErrorResponse(res, 500, error.details[0].message);
            }

            if (
                !req.files?.backgroundImage ||
                !req.files?.backgroundImage[0]?.path
            ) {
                return sendErrorResponse(
                    res,
                    400,
                    "Background Image is required"
                );
            }

            const backgroundImage =
                "/" + req.files?.backgroundImage[0]?.path.replace(/\\/g, "/");

            let icon;
            if (req.files?.icon && req.files?.icon[0]?.path) {
                icon = "/" + req.files?.icon[0]?.path.replace(/\\/g, "/");
            }

            const homeSettings = await HomeSettings.findOneAndUpdate(
                {
                    settingsNumber: 1,
                },
                {
                    $push: {
                        cards: {
                            title,
                            backgroundImage,
                            description,
                            tag,
                            icon,
                            url,
                            isRelativeUrl,
                        },
                    },
                },
                { runValidators: true, new: true, upsert: true }
            ).lean();

            res.status(200).json({
                ...homeSettings.cards[homeSettings?.cards?.length - 1],
            });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    updateHomeCard: async (req, res) => {
        try {
            const { cardId } = req.params;
            const { title, description, tag, url, isRelativeUrl } = req.body;

            const { _, error } = homeCardSettingsSchema.validate(req.body);
            if (error) {
                return sendErrorResponse(res, 500, error.details[0].message);
            }

            if (!isValidObjectId(cardId)) {
                return sendErrorResponse(res, 400, "Invalid card id");
            }

            let backgroundImage;
            if (
                req.files?.backgroundImage &&
                req.files?.backgroundImage[0]?.path
            ) {
                backgroundImage =
                    "/" +
                    req.files?.backgroundImage[0]?.path.replace(/\\/g, "/");
            }

            let icon;
            if (req.files?.icon && req.files?.icon[0]?.path) {
                icon = "/" + req.files?.icon[0]?.path.replace(/\\/g, "/");
            }

            const homeSettings = await HomeSettings.findOneAndUpdate(
                {
                    settingsNumber: 1,
                    "cards._id": cardId,
                },
                {
                    "cards.$.title": title,
                    "cards.$.description": description,
                    "cards.$.backgroundImage": backgroundImage,
                    "cards.$.tag": tag,
                    "cards.$.icon": icon,
                    "cards.$.url": url,
                    "cards.$.isRelativeUrl": isRelativeUrl,
                },
                { runValidators: true, new: true }
            );

            if (!homeSettings) {
                return sendErrorResponse(res, 404, "Home Settings not found");
            }

            res.status(200).json({ message: "Card successfully updated" });
        } catch (err) {
            sendErrorResponse(res, 400, err);
        }
    },

    deleteHomeCard: async (req, res) => {
        try {
            const { cardId } = req.params;

            if (!isValidObjectId(cardId)) {
                return sendErrorResponse(res, 400, "Invalid card id");
            }

            await HomeSettings.findOneAndUpdate(
                { settingsNumber: 1 },
                {
                    $pull: { cards: { _id: cardId } },
                }
            );

            res.status(200).json({
                message: "Card successfully removed",
                _id: cardId,
            });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    updateHomeFooter: async (req, res) => {
        try {
            const { footer } = req.body;

            const { _, error } = homeFooterSettingsSchema.validate(req.body);
            if (error) {
                return sendErrorResponse(res, 400, error.details[0].message);
            }

            const homeSettings = await HomeSettings.findOneAndUpdate(
                { settingsNumber: 1 },
                { footer },
                { runValidators: true, new: true, upsert: true }
            ).lean();

            res.status(200).json({
                footer: homeSettings.footer[homeSettings.footer?.length - 1],
            });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    // deleteHomeFooter: async (req, res) => {
    //     try {
    //         const { id } = req.params;

    //         if (!isValidObjectId(id)) {
    //             return sendErrorResponse(res, 400, "Invalid footer id");
    //         }

    //         await HomeSettings.findOneAndUpdate(
    //             { settingsNumber: 1 },
    //             {
    //                 $pull: { footer: { _id: id } },
    //             }
    //         );

    //         res.status(200).json({
    //             message: "Footer successfully removed",
    //             _id: id,
    //         });
    //     } catch (err) {
    //         sendErrorResponse(res, 500, err);
    //     }
    // },

    updateMetaDetails: async (req, res) => {
        try {
            const {
                email,
                phoneNumber1,
                phoneNumber2,
                facebookUrl,
                instagramUrl,
                footerDescription,
            } = req.body;

            const { _, error } = homeMetaSettingsSchema.validate(req.body);
            if (error) {
                return sendErrorResponse(res, 400, error.details[0].message);
            }

            await HomeSettings.findOneAndUpdate(
                { settingsNumber: 1 },
                {
                    email,
                    phoneNumber1,
                    phoneNumber2,
                    facebookUrl,
                    instagramUrl,
                    footerDescription,
                },
                { runValidators: true, new: true, upsert: true }
            );

            res.status(200).json({
                message: "Footer description successfully updated",
            });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    updateHomeSections: async (req, res) => {
        try {
            const {
                isBestSellingAttractionsSectionEnabled,
                bestSellingAttractions,
                isTopAttractionsSectionEnabled,
                topAttractions,
                isBlogsEnabled,
            } = req.body;

            const { _, error } = homeSectionsSettingsSchema.validate(req.body);
            if (error) {
                return sendErrorResponse(res, 400, error.details[0].message);
            }

            await HomeSettings.findOneAndUpdate(
                { settingsNumber: 1 },
                {
                    isBestSellingAttractionsSectionEnabled,
                    bestSellingAttractions,
                    isTopAttractionsSectionEnabled,
                    topAttractions,
                    isBlogsEnabled,
                },
                { runValidators: true, new: true, upsert: true }
            );

            res.status(200).json({
                message: "Sections successfully updated",
            });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    getMetaDetails: async (req, res) => {
        try {
            const home = await HomeSettings.findOne({
                settingsNumber: 1,
            });
            if (!home) {
                return sendErrorResponse(res, 404, "Home not found");
            }

            res.status(200).json({
                phoneNumber1: home?.phoneNumber1,
                phoneNumber2: home?.phoneNumber2,
                email: home?.email,
                facebookUrl: home?.facebookUrl,
                instagramUrl: home?.instagramUrl,
                footerDescription: home?.footerDescription,
            });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    getFooter: async (req, res) => {
        try {
            const home = await HomeSettings.findOne({
                settingsNumber: 1,
            });
            if (!home) {
                return sendErrorResponse(res, 404, "Home not found");
            }

            res.status(200).json({
                footer: home?.footer,
            });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    getHeros: async (req, res) => {
        try {
            const home = await HomeSettings.findOne({
                settingsNumber: 1,
            });
            if (!home) {
                return sendErrorResponse(res, 404, "Home not found");
            }

            res.status(200).json({
                heros: home?.heros,
            });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    getSingleCard: async (req, res) => {
        try {
            const { cardId } = req.params;

            if (!isValidObjectId(cardId)) {
                return sendErrorResponse(res, 400, "Invalid card Id");
            }

            const homeSettings = await HomeSettings.findOne({
                settingsNumber: 1,
                "cards._id": cardId,
            });
            if (!homeSettings) {
                return sendErrorResponse(res, 404, "Card not found");
            }

            const filteredCards = homeSettings.cards.filter((item) => {
                return item?._id?.toString() === cardId?.toString();
            });

            res.status(200).json(filteredCards[0]);
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    getSections: async (req, res) => {
        try {
            const home = await HomeSettings.findOne({
                settingsNumber: 1,
            });

            const attractions = await Attraction.find({ isDeleted: false });

            if (!home) {
                return res.status(200).json({
                    isBestSellingAttractionsSectionEnabled: false,
                    bestSellingAttractions: [],
                    isTopAttractionsSectionEnabled: false,
                    topAttractions: [],
                    isBlogsEnabled: false,
                    attractions,
                });
            }

            const bestSellingAttractions = await Attraction.aggregate([
                {
                    $match: {
                        _id: { $in: home.bestSellingAttractions },
                    },
                },
                {
                    $project: {
                        title: 1,
                        images: 1,
                    },
                },
            ]);

            const topAttractions = await Attraction.aggregate([
                {
                    $match: {
                        _id: { $in: home.topAttractions },
                    },
                },
                {
                    $project: {
                        title: 1,
                        images: 1,
                    },
                },
            ]);

            res.status(200).json({
                isBestSellingAttractionsSectionEnabled:
                    home.isBestSellingAttractionsSectionEnabled,
                bestSellingAttractions,
                isTopAttractionsSectionEnabled:
                    home.isTopAttractionsSectionEnabled,
                topAttractions,
                isBlogsEnabled: home.isBlogsEnabled,
                attractions,
            });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },
};
