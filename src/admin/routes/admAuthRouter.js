const router = require("express").Router();

const {
    addNewAdmin,
    adminLogin,
    deleteAdmin,
    getAllAdmins,
    getAdmin,
} = require("../controllers/admAuthController");
const adminAuth = require("../middlewares/adminAuth");
const superAdminAuth = require("../middlewares/superAdminAuth");

router.post("/add", superAdminAuth, addNewAdmin);
router.post("/login", adminLogin);

router.get("/all", superAdminAuth, getAllAdmins);
router.get("/my-account", adminAuth, getAdmin);

router.delete("/delete/:id", superAdminAuth, deleteAdmin);

module.exports = router;
