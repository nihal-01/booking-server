const router = require("express").Router();

const {listVisa , listVisaType} = require('../controllers/visaListController')


router.get('/all' , listVisa)
router.get('/type/all/:id' , listVisaType)


module.exports = router;