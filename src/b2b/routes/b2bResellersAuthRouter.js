const router = require("express").Router();
const multer = require("multer");
const path = require("path");

const {
    resellerRegister,
    resellerLogin,
    updateProfileSetting,
    updateCompanySettings,
    updatePassword,
} = require("../controllers/b2bResellersAuthController");
const resellerAuth = require("../middleware/b2bResellerAuthVerify");


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "public/images/b2b");
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

router.post("/signup", resellerRegister);
router.post("/login", resellerLogin);
router.patch("/update/profileSetings",resellerAuth ,upload.single("image"), updateProfileSetting);
router.patch("/update/comapnySettings",resellerAuth , updateCompanySettings);
router.patch('/update/password' ,resellerAuth , updatePassword )



module.exports = router;
