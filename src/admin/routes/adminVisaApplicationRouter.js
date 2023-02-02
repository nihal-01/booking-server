const router = require("express").Router();

const { listAllVisaApplication , listSingleVisaApplication} = require('../controllers/admVisaApplicationController')

router.get('/all' , listAllVisaApplication )
router.get('/:id' , listSingleVisaApplication )



module.exports = router;
