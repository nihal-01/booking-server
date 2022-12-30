const router = require("express").Router();
const multer = require("multer");

const {
    createNewAttraction,
    addAttractionActivity,
    getAllAttractions,
    getInitialData,
} = require("../controllers/admAttractionsController");

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

router.post("/create", upload.array("images"), createNewAttraction);
router.post("/activities/add", addAttractionActivity);

router.get("/all", getAllAttractions);
router.get("/initial-data", getInitialData);

module.exports = router;
