const b2bResellersAuthRouter = require("./b2bResellersAuthRouter");
const b2bResellersRouter = require("./b2bResellersRouter");
const b2bClientAttractionRouter = require("./b2bClientAttractionRoute");
const b2bClientAttractionMarkupRouter = require("./b2b2ClientAttractionMarkupRoute");
const b2bSubAgentAttractionMarkupRouter = require("./b2bSubAgentAttractionMarkupRouter");
const b2bWalletDepositRouter = require('./b2bWalletDepositRouter')
const b2bAttractionOrdersRouter = require('./b2bAttractionOrdersRoute')
const b2bTransactionRouter = require('./b2bTransactionsRouter')

module.exports = {
  b2bResellersAuthRouter,
  b2bResellersRouter,
  b2bClientAttractionRouter,
  b2bClientAttractionMarkupRouter,
  b2bSubAgentAttractionMarkupRouter,
  b2bWalletDepositRouter,
  b2bAttractionOrdersRouter,
  b2bTransactionRouter
  
};
