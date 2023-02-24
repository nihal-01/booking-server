const router = require("express").Router();

const {
    listRefundAll,
    approveRefundRequest,
    cancelRefundRequest,
} = require("../controllers/admRefundController");

router.get("/all", listRefundAll);
router.patch("/approve/:requestId", approveRefundRequest);
router.patch("/cancel/:requestId", cancelRefundRequest);

module.exports = router;
