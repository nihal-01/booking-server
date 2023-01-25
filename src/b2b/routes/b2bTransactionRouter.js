const router = require('express').Router()

const {getB2BTransactions } = require('../controllers/b2bTransationController')
const { b2bAuth } = require('../middlewares')

router.get('/list' , b2bAuth ,  getB2BTransactions)

module.exports = router