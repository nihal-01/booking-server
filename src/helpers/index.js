const sendErrorResponse = require("./sendErrorResponse");
const sendEmail = require("./sendEmail");
const sendAdminPassword = require("./sendAdminPassword");
const createQuotationPdf = require("./ticketInvoice");
const getOtpSettings = require("./getOtpSettings");

module.exports = {
    sendErrorResponse,
    sendEmail,
    sendAdminPassword,
    createQuotationPdf,
    getOtpSettings,
};
