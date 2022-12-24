const router = require("express").Router();
const multer = require("multer");

const {
    updateHomeHeader,
    updateHomeHero,
    updateHomeFooter,
    deleteHomeCard,
    addNewHomeCard,
    deleteHomeFooter,
    updateHomeLogo,
    updateMetaDetails,
    updateHomeSections,
} = require("../controllers/admHomeControllers");

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "public/images/home");
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(
            null,
            file.fieldname +
                "-" +
                uniqueSuffix +
                "." +
                file.originalname.split(".")[1]
        );
    },
});

const upload = multer({
    limits: {
        fileSize: 2000000,
    },
    fileFilter: (req, file, cb) => {
        const allowed = ["jpg", "jpeg", "png", "webp"];
        if (!allowed.includes(file.originalname.split(".")[1])) {
            return cb(new Error("Please upload jpg, jpeg, webp, or png"));
        }
        cb(undefined, true);
    },
    storage: storage,
});

const multipleUplaod = upload.fields([
    { name: "backgroundImage", maxCount: 1 },
    { name: "icon", maxCount: 1 },
]);

router.patch("/update/header", upload.single("logo"), updateHomeLogo);
router.patch("/update/hero", upload.array("heroImages"), updateHomeHero);
router.patch("/add/footer", updateHomeFooter);
router.patch("/add/card", multipleUplaod, addNewHomeCard);
router.patch("/update/meta", updateMetaDetails);
router.patch("/update/sections", updateHomeSections);

router.delete("/delete/footer/:id", deleteHomeFooter);
router.delete("/delete/card/:id", deleteHomeCard);
router.delete("/delete/hero-image/:url", deleteHomeCard);

module.exports = router;
