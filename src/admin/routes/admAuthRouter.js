const router = require("express").Router();
const multer = require("multer");
const path = require("path");

const {
    addNewAdmin,
    adminLogin,
    deleteAdmin,
    getAllAdmins,
    getAdmin,
    updateAdminDetails,
    updateAdminPassword,
} = require("../controllers/admAuthController");
const adminAuth = require("../middlewares/adminAuth");
const superAdminAuth = require("../middlewares/superAdminAuth");

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "public/images/admins");
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

router.post("/add", superAdminAuth, upload.single("avatar"), addNewAdmin);
router.post("/login", adminLogin);

router.patch("/update", adminAuth, upload.single("avatar"), updateAdminDetails);
router.patch("/update/password", adminAuth, updateAdminPassword);

router.get("/all", superAdminAuth, getAllAdmins);
router.get("/my-account", adminAuth, getAdmin);

router.delete("/delete/:id", superAdminAuth, deleteAdmin);

module.exports = router;
