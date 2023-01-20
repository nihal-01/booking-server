const router = require("express").Router();

const {
    sendMail,
    addNewMail,
    updateEmail,
    deleteEmail,
    getAllEmails,
} = require("../controllers/admEmailsController");

router.post("/send", sendMail);
router.post("/add", addNewMail);

router.patch("/update/:id", updateEmail);

router.delete("/delete/:id", deleteEmail);

router.get("/all", getAllEmails);

module.exports = router;
