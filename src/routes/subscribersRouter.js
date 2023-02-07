const router = require("express").Router();

const {
  doSubscribe,
  doUnsubscribe,
} = require("../controllers/subscribersController");

router.post("/subscribe", doSubscribe);
router.post("/unsubscribe", doUnsubscribe);

module.exports = router;
