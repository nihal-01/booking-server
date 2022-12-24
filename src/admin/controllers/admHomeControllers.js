const { isValidObjectId } = require("mongoose");
const { sendErrorResponse } = require("../../helpers");
const { HomeSettings } = require("../../model/");
const {
    homeFooterSettingsSchema,
    homeHeroSettingsSchema,
    homeHederSettingsSchema,
    homeCardSettingsSchema,
    homeMetaSettingsSchema,
    homeSectionsSettingsSchema,
} = require("../validations/homeSettings.schema");

module.exports = {
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

    updateHomeHero: async (req, res) => {
        try {
            const { heroTitle, heroDescription } = req.body;

            const { _, error } = homeHeroSettingsSchema.validate(req.body);
            if (error) {
                return sendErrorResponse(res, 400, error.details[0].message);
            }

            let heroImages = [];
            for (let i = 0; i < req.files?.length; i++) {
                const img = "/" + req.files[i]?.path?.replace(/\\/g, "/");
                heroImages.push(img);
            }

            await HomeSettings.findOneAndUpdate(
                { settingsNumber: 1 },
                {
                    heroTitle,
                    heroDescription,
                    $push: { heroImages: [...heroImages] },
                },
                { upsert: true, new: true, runValidators: true }
            );

            res.status(200).json({
                heroTitle,
                heroDescription,
                heroImages,
            });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    deleteHomeHeroImage: async (req, res) => {
        try {
            const { url } = req.params;

            if (isNaN(index)) {
                return sendErrorResponse(
                    res,
                    400,
                    "Please provide a valid index"
                );
            }

            await HomeSettings.findOneAndUpdate(
                { settingsNumber: 1 },
                {
                    $pull: { heroImages: url },
                }
            );

            res.status(200).json({
                message: "Hero Image successfully removed",
                url,
            });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    addNewHomeCard: async (req, res) => {
        try {
            const { title, description, tag } = req.body;

            const { _, error } = homeCardSettingsSchema.validate(req.body);
            if (error) {
                return sendErrorResponse(res, 500, error.details[0].message);
            }

            if (!req.files?.backgroundImage[0]?.path) {
                return sendErrorResponse(
                    res,
                    400,
                    "Background Image is required"
                );
            }

            const backgroundImage =
                "/" + req.files?.backgroundImage[0]?.path.replace(/\\/g, "/");

            let icon;
            if (req.files?.icon[0]?.path) {
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

    deleteHomeCard: async (req, res) => {
        try {
            const { id } = req.params;

            if (!isValidObjectId(id)) {
                return sendErrorResponse(res, 400, "Invalid card id");
            }

            await HomeSettings.findOneAndUpdate(
                { settingsNumber: 1 },
                {
                    $pull: { cards: { _id: id } },
                }
            );

            res.status(200).json({
                message: "Card successfully removed",
                _id: id,
            });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    updateHomeFooter: async (req, res) => {
        try {
            const { title, navLinks } = req.body;

            const { _, error } = homeFooterSettingsSchema.validate(req.body);
            if (error) {
                return sendErrorResponse(res, 400, error.details[0].message);
            }

            const homeSettings = await HomeSettings.findOneAndUpdate(
                { settingsNumber: 1 },
                { $push: { footer: { title, navLinks } } },
                { runValidators: true, new: true, upsert: true }
            ).lean();

            res.status(200).json({
                footer: homeSettings.footer[homeSettings.footer?.length - 1],
            });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    deleteHomeFooter: async (req, res) => {
        try {
            const { id } = req.params;

            if (!isValidObjectId(id)) {
                return sendErrorResponse(res, 400, "Invalid footer id");
            }

            await HomeSettings.findOneAndUpdate(
                { settingsNumber: 1 },
                {
                    $pull: { footer: { _id: id } },
                }
            );

            res.status(200).json({
                message: "Footer successfully removed",
                _id: id,
            });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    updateMetaDetails: async (req, res) => {
        try {
            const {
                email,
                mobileNumber1,
                mobileNumber2,
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
                    mobileNumber1,
                    mobileNumber2,
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
};
