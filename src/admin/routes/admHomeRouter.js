const router = require("express").Router();
const multer = require("multer");
const path = require("path");

const {
    addHomeHero,
    updateHomeFooter,
    deleteHomeCard,
    addNewHomeCard,
    deleteHomeFooter,
    updateHomeLogo,
    updateMetaDetails,
    updateHomeSections,
    getLogo,
    getAllCards,
    getMetaDetails,
    getFooter,
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
        const allowed = [".jpg", ".jpeg", ".png", ".webp"];
        const ext = path.extname(file.originalname);
        if (!allowed.includes(ext)) {
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

router.post("/add/hero", upload.single("image"), addHomeHero);
router.post("/add/card", multipleUplaod, addNewHomeCard);

router.patch("/update/logo", upload.single("logo"), updateHomeLogo);
router.patch("/update/meta", updateMetaDetails);
router.patch("/update/sections", updateHomeSections);
router.patch("/update/footer", updateHomeFooter);

router.delete("/delete/footer/:id", deleteHomeFooter);
router.delete("/delete/card/:id", deleteHomeCard);
router.delete("/delete/hero-image/:url", deleteHomeCard);

router.get("/logo", getLogo);
router.get("/cards", getAllCards);
router.get("/meta-details", getMetaDetails);
router.get("/footer", getFooter);

module.exports = router;
