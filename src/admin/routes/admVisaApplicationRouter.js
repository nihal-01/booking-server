const router = require("express").Router();
const path = require("path");
const multer = require("multer");

const { listAllVisaApplication ,cancelVisaApplicationStatus, approveVisaApplicationStatus,listSingleVisaApplication} = require('../controllers/admVisaApplicationController')


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "public/images/visa");
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
        const allowed = [".pdf",];
        const ext = path.extname(file.originalname);
        if (!allowed.includes(ext)) {
            return cb(new Error("Please upload pdf"));
        }
        cb(undefined, true);
    },
    storage: storage,
});




router.get('/all' , listAllVisaApplication )
router.get('/:id' , listSingleVisaApplication )
router.post("/:id/approve" ,upload.single('pdfFile'),   approveVisaApplicationStatus)
router.post("/:id/approve" , cancelVisaApplicationStatus)





module.exports = router;
