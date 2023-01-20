const router = require("express").Router();

const {
    getSingleAttraction,
    getAllAttractions,
    listAllAttractions
} = require("../controllers/b2bClientAttractionController");
const { b2bAuth } = require("../middlewares");

router.get("/single/:id", b2bAuth, getSingleAttraction);
router.get("/all", b2bAuth , getAllAttractions);
router.get("/listall", b2bAuth , listAllAttractions);


module.exports = router;