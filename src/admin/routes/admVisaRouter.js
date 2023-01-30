const router = require("express").Router();
const path = require("path");
const multer = require("multer");


const {
    createNewVisa,
    addNewVisaType,
    listAllVisa,
    listAllVisaType,
    getSingleVisa,
    getSingleVisaType,
    updateVisa,
    updateVisaType,
    deleteVisa,
    deleteVisaType
} = require("../controllers/admVisaController");

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

router.post(
    "/country-visa/create",
    upload.single("image"),
    createNewVisa
);
router.post("/add", addNewVisaType);
router.get('/all' , listAllVisa )
router.get('/visa-type/all' , listAllVisaType )
router.get('/:id' , getSingleVisa)
router.get('/:id/visa-type' , getSingleVisaType)
router.patch('/update/:id' ,upload.single("image"),updateVisa)
router.patch('/update/:id/visa-type' , updateVisaType)
router.patch('/delete/:id' , deleteVisa)
router.patch('/delete/visa-type/:id' , deleteVisaType)





module.exports = router;
