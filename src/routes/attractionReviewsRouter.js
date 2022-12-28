const router = require("express").Router();

const {
    addAttractionReview,
    getSingleAttractionReviews,
} = require("../controllers/attractionReviewsController");
const { userAuth } = require("../middlewares");

router.post("/add", userAuth, addAttractionReview);
router.get("/single/:id", getSingleAttractionReviews);

module.exports = router;
