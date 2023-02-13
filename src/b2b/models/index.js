const Reseller = require("./reseller.model");
const B2BClientAttractionMarkup = require("./b2bClientAttraction.model");
const B2BSubAgentAttractionMarkup = require("./b2bSubAgentAttractionMarkup");
const B2BTransaction = require("./b2bTransaction.model");
const B2BWallet = require("./b2bWallet.model");
const B2BAttractionOrder = require("./b2bAttractionOrder.model");
const B2BClientVisaMarkup = require("./b2bClientVisaMarkUp.modal");
const B2BSubAgentVisaMarkup = require("./b2bSubAgentVisaMarkup.modal");
const B2BSpecialMarkup = require("./b2bSpecialMarkup.modal");

module.exports = {
  Reseller,
  B2BClientVisaMarkup,
  B2BSubAgentVisaMarkup,
  B2BClientAttractionMarkup,
  B2BSubAgentAttractionMarkup,
  B2BTransaction,
  B2BWallet,
  B2BAttractionOrder,
  B2BSpecialMarkup,
};
