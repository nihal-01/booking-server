const router = require("express").Router();

const {
    updateOtpSettings,
    getOtpSettings,
} = require("../controllers/admOtpSettingsController");

router.get("/", getOtpSettings);
router.patch("/update", updateOtpSettings);

module.exports = router;
