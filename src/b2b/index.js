const router = require("express").Router();

const reseller = require ('./routes/resellerRoutes')


router.use('/reseller' , reseller )

module.exports = router;
