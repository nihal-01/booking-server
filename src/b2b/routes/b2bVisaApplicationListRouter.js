const {
    getB2BAllVisaApplication,
    getB2BSingleVisaApplication,
    visaSingleTraveller,
} = require("../controllers/b2bVisaApplicationListController");
const { b2bAuth } = require("../middlewares");

const router = require("express").Router();

router.get("/all", b2bAuth, getB2BAllVisaApplication);
router.get("/:id", b2bAuth, getB2BSingleVisaApplication);
router.get(
    "/:applicationId/traveller/:travellerId",
    b2bAuth,
    visaSingleTraveller
);

module.exports = router;
