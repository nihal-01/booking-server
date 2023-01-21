const router = require("express").Router();

const {
    getEmailSettings,
    updateEmailSettings,
} = require("../controllers/admEmailSettingsController");

router.get("/", getEmailSettings);
router.patch("/update", updateEmailSettings);

module.exports = router;
