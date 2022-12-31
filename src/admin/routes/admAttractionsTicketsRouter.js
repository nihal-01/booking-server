const router = require("express").Router();
const multer = require("multer");

const {
    uploadTicket,
} = require("../controllers/admAttractionTicketsController");

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "public/csv/tickets");
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
        const allowed = [".csv"];
        const ext = path.extname(file.originalname);
        if (!allowed.includes(ext)) {
            return cb(new Error("Please upload csv file"));
        }
        cb(undefined, true);
    },
    storage: storage,
});

router.post("/upload", upload.single("tickets"), uploadTicket);

module.exports = router;
