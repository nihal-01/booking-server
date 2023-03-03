const sendSubAgentPassword = require("./sendSubAgentPassword");
const sendWalletDeposit = require("./sendWalletDepositEmail");
const { createDubaiParkOrder} = require('./createDubaiParkOrder')
const {
    getTimeSlotWithRate,
    getTicketType,
    getTimeSlot,
} = require("./burjKhalifaApiHelper");
const { flightAvailabilitySearch} = require('./b2bFlightHelper')

module.exports = {
    sendWalletDeposit,
    sendSubAgentPassword,
    getTimeSlotWithRate,
    getTimeSlot,
    getTicketType,
    createDubaiParkOrder,
    flightAvailabilitySearch
};
