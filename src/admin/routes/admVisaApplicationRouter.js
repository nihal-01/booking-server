const router = require("express").Router();
const path = require("path");
const multer = require("multer");

const {
    listAllVisaApplication,
    cancelVisaApplicationStatus,
    approveVisaApplicationStatus,
    listSingleVisaApplication,
} = require("../controllers/admVisaApplicationController");

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "public/images/visaApproved");
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
        const allowed = [".pdf"];
        const ext = path.extname(file.originalname);
        if (!allowed.includes(ext)) {
            return cb(new Error("Please upload pdf"));
        }
        cb(undefined, true);
    },
    storage: storage,
});

router.get("/all", listAllVisaApplication);
router.get("/:orderedBy/:id/single/:travellerId", listSingleVisaApplication);
router.patch(
    "/:id/approve/:travellerId",
    upload.single("pdfFile"),
    approveVisaApplicationStatus
);
router.patch("/:id/reject/:travellerId", cancelVisaApplicationStatus);

module.exports = router;
