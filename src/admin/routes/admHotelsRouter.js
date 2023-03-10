const router = require("express").Router();
const multer = require("multer");
const path = require("path");

const {
    addNewHotel,
    deleteHotel,
    getAllHotels,
    updateHotel,
    uploadBulkHotels,
    getInitialData,
    getSingleHotelWithRoomTypes,
    getHotelsName,
} = require("../controllers/admHotelsController");

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "public/images/hotels");
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

router.post("/add", upload.array("images"), addNewHotel);
router.post("/upload", uploadBulkHotels);
router.patch("/update/:id", upload.array("images"), updateHotel);
router.delete("/delete/:id", deleteHotel);
router.get("/all", getAllHotels);
router.get("/initial-data", getInitialData);
router.get("/single/:id", getSingleHotelWithRoomTypes);
router.get("/names", getHotelsName);

module.exports = router;
