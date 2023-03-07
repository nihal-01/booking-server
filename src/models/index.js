const HomeSettings = require("./settings/homeSettings.model");
const Subscriber = require("./global/subscriber.model");
const AttractionCategory = require("./attraction/attractionCategory.model");
const Attraction = require("./attraction/attraction.model");
const Blog = require("./blog/blog.model");
const BlogCategory = require("./blog/blogCategory.model");
const AttractionActivity = require("./attraction/attractionActivity.model");
const User = require("./global/user.model");
const Visa = require("./visa/visa.model");
const VisaType = require("./visa/visaType.model");
const Coupon = require("./global/coupon.model");
const AttractionTicket = require("./attraction/attractionTicket.model");
const Country = require("./global/country.model");
const Destination = require("./attraction/destination.model");
const AttractionOrder = require("./attraction/attractionOrder.model");
const VisaApplication = require("./visa/visaApplication.model");
const VisaDocument = require("./visa/visaDocument.model");
const AttractionReview = require("./attraction/attractionReview.model");
const Currency = require("./global/currency.modal");
const Driver = require("./global/driver.model");
const B2CTransaction = require("./global/b2cTransaction.model");
const B2CAttractionMarkup = require("./attraction/b2cAttractionMarkup.model");
const B2CWallet = require("./global/b2cWallet.model");
const PaymentService = require("./settings/paymentService.model");
const OtpSettings = require("./settings/otpSettings.model");
const EmailSettings = require("./settings/emailSettings.model");
const Hotel = require("./hotel/hotel.model");
const HotelFacility = require("./hotel/hotelFacility.model");
const HotelContract = require("./hotel/hotelContract.model");
const RoomType = require("./hotel/roomType.model");
const B2CVisaApplication = require("./visa/b2cVisaApplication.model");
const ApiMaster = require("./settings/apiMaster.model");
const Airport = require("./flight/airport.model");
const Airline = require("./flight/airline.model");
const B2CBankDetails = require("./global/b2cBankDetails.model");
const Refund = require("./global/refund.model");
const AttractionItinerary = require("./attraction/attractionItinerary.model");
const B2cClientVisaMarkup = require("./visa/b2cVisaMarkup.Model");

module.exports = {
    HomeSettings,
    Subscriber,
    AttractionCategory,
    Attraction,
    Blog,
    BlogCategory,
    AttractionActivity,
    User,
    Visa,
    VisaType,
    Coupon,
    AttractionTicket,
    Country,
    Destination,
    AttractionOrder,
    VisaApplication,
    VisaDocument,
    AttractionReview,
    Currency,
    Driver,
    B2CAttractionMarkup,
    B2CAttractionMarkup,
    B2CTransaction,
    B2CWallet,
    PaymentService,
    OtpSettings,
    EmailSettings,
    Hotel,
    RoomType,
    HotelContract,
    HotelFacility,
    B2CVisaApplication,
    ApiMaster,
    AttractionItinerary,
    Refund,
    B2CBankDetails,
    Airport,
    Airline,
    B2cClientVisaMarkup,
};
