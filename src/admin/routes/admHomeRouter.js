const router = require("express").Router();
const multer = require("multer");
const path = require("path");

const {
    addHomeHeros,
    updateHomeFooter,
    deleteHomeCard,
    addHomeCard,
    updateHomeLogo,
    updateMetaDetails,
    updateHomeSections,
    getLogo,
    getAllCards,
    getMetaDetails,
    getFooter,
    getHeros,
    updateHomeHero,
    deleteHomeHero,
    updateHomeCard,
    getSingleCard,
    getSections,
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

router.post("/heros/add", upload.single("image"), addHomeHeros);
router.post("/cards/add", multipleUplaod, addHomeCard);

router.patch("/logo/update", upload.single("logo"), updateHomeLogo);
router.patch("/meta/update", updateMetaDetails);
router.patch("/sections/update", updateHomeSections);
router.patch("/footer/update", updateHomeFooter);
router.patch("/heros/update/:heroId", upload.single("image"), updateHomeHero);
router.patch("/cards/update/:cardId", multipleUplaod, updateHomeCard);

router.delete("/cards/delete/:cardId", deleteHomeCard);
router.delete("/heros/delete/:heroId", deleteHomeHero);

router.get("/logo", getLogo);
router.get("/cards", getAllCards);
router.get("/meta-details", getMetaDetails);
router.get("/footer", getFooter);
router.get("/heros", getHeros);
router.get("/cards/:cardId", getSingleCard);
router.get("/sections", getSections);

module.exports = router;
