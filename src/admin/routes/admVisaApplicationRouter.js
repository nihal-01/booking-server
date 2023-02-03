const router = require("express").Router();

const { listAllVisaApplication ,cancelVisaApplicationStatus, approveVisaApplicationStatus,listSingleVisaApplication} = require('../controllers/admVisaApplicationController')

router.get('/all' , listAllVisaApplication )
router.get('/:id' , listSingleVisaApplication )
router.post("/:id/approve" , approveVisaApplicationStatus)
router.post("/:id/approve" , cancelVisaApplicationStatus)





module.exports = router;
