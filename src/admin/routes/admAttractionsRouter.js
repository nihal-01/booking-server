const router = require("express").Router();
const multer = require("multer");
const path = require("path");

const {
    createNewAttraction,
    addAttractionActivity,
    getAllAttractions,
    getInitialData,
    getSingleAttraction,
    updateAttraction,
    deleteAttraction,
    getAllOrders,
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
        fileSize: 20000000,
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

router.post("/create", upload.array("images"), createNewAttraction);
router.post("/activities/add", addAttractionActivity);

router.patch("/update/:id", upload.array("images"), updateAttraction);

router.get("/all", getAllAttractions);
router.get("/initial-data", getInitialData);
router.get("/single/:id", getSingleAttraction);
router.get("/attractions/orders/all", getAllOrders);

router.delete("/delete/:id", deleteAttraction);

module.exports = router;
