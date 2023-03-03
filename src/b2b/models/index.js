const Reseller = require("./reseller.model");
const B2BClientAttractionMarkup = require("./b2bClientAttraction.model");
const B2BSubAgentAttractionMarkup = require("./b2bSubAgentAttractionMarkup");
const B2BTransaction = require("./b2bTransaction.model");
const B2BWallet = require("./b2bWallet.model");
const B2BAttractionOrder = require("./b2bAttractionOrder.model");
const B2BClientVisaMarkup = require("./b2bClientVisaMarkUp.modal");
const B2BSubAgentVisaMarkup = require("./b2bSubAgentVisaMarkup.modal");
const B2BSpecialAttractionMarkup = require("./b2bAttractionSpecialMarkup.modal");
const B2BSpecialVisaMarkup = require("./b2bVisaSpecialMarkup.modal");
const B2BBankDetails = require("./b2bBankDetails.model");
const B2BWalletWithdraw = require("./b2bWithdrawRequest.model");
const B2BClientFlightMarkup = require("./b2bClientFlightMarkup.model");
const B2BSubAgentFlightMarkup = require("./b2bSubAgentFlightMarkup.model");

module.exports = {
    Reseller,
    B2BClientVisaMarkup,
    B2BSubAgentVisaMarkup,
    B2BClientAttractionMarkup,
    B2BSubAgentAttractionMarkup,
    B2BTransaction,
    B2BWallet,
    B2BAttractionOrder,
    B2BSpecialAttractionMarkup,
    B2BSpecialVisaMarkup,
    B2BBankDetails,
    B2BWalletWithdraw,
    B2BSubAgentFlightMarkup,
    B2BClientFlightMarkup,
};
