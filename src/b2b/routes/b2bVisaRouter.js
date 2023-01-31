const router = require("express").Router();
const multer = require('multer')
const path = require('path')

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "public/images/attractions");
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


const { getSingleVisa,listAll, applyVisa , getAllVisa ,completeVisaPaymentOrder , completeVisaDocumentOrder} = require("../controllers/b2bVisaController");
const { b2bAuth } = require("../middlewares");

router.get("/single/:id", b2bAuth, getSingleVisa);
router.get("/all", b2bAuth , getAllVisa);
router.get("/list" ,b2bAuth , listAll  )
router.post("/create", b2bAuth , applyVisa);
router.post("/payment/:orderId", b2bAuth , completeVisaPaymentOrder);
router.post('/document/:orderId' ,b2bAuth , upload.array("images") ,  completeVisaDocumentOrder )


module.exports = router;