const sendSubAgentPassword = require("./sendSubAgentPassword");
const sendWalletDeposit = require("./sendWalletDepositEmail");
const { createDubaiParkOrder } = require("./createDubaiParkOrder");
const {
    getTimeSlotWithRate,
    getTicketType,
    getTimeSlot,
} = require("./burjKhalifaApiHelper");
const {
    flightAvailabilitySearch,
    getSingleTripDetails,
} = require("./b2bFlightHelper");

const { flightAvailabiltie } = require("./jazeeraAirwaysHelper");

module.exports = {
    sendWalletDeposit,
    sendSubAgentPassword,
    getTimeSlotWithRate,
    getTimeSlot,
    getTicketType,
    createDubaiParkOrder,
    flightAvailabilitySearch,
    getSingleTripDetails,
    flightAvailabiltie,
};
