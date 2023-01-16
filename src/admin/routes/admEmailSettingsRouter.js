const router = require("express").Router();

const {
    addNewMail,
    deleteEmailSettings,
    emailSettingsSendMail,
    updateEmailSettings,
    getAllEmailSettings,
    getAllSentEmailsList,
} = require("../controllers/admEmailSettingsController");

router.post("/send", emailSettingsSendMail);
router.post("/add", addNewMail);

router.patch("/update/:id", updateEmailSettings);

router.delete("/delete/:id", deleteEmailSettings);

router.get("/all", getAllEmailSettings);
router.get("/sent/all", getAllSentEmailsList);

module.exports = router;
