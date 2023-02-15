const { isValidObjectId } = require("mongoose");
const crypto = require("crypto");
const Razorpay = require("razorpay");
const nodeCCAvenue = require("node-ccavenue");
const qs = require("querystring");

const { sendErrorResponse } = require("../helpers");
const {
  Attraction,
  AttractionActivity,
  AttractionOrder,
  AttractionTicket,
  User,
  Country,
  B2CAttractionMarkup,
  B2CTransaction,
} = require("../models");
const {
  attractionOrderSchema,
} = require("../validations/attractionOrder.schema");
const { createOrder, fetchOrder, fetchPayment } = require("../utils/paypal");
const { generateUniqueString } = require("../utils");
const { convertCurrency } = require("../b2b/helpers/currencyHelpers");
const {
  completeOrderAfterPayment,
} = require("../helpers/attractionOrderHelpers");

const  {getUserOrder}  = require("../helpers/userOrderHelper");

const dayNames = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

const instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const ccav = new nodeCCAvenue.Configure({
  merchant_id: process.env.CCAVENUE_MERCHANT_ID,
  working_key: process.env.CCAVENUE_WORKING_KEY,
});

// TODO
// 1. VAT Calculation
// 2. Send password for new emails
// 3. Verify Mobile Number
module.exports = {
  createAttractionOrder: async (req, res) => {
    try {
      const { selectedActivities, name, email, phoneNumber, country } =
        req.body;

      const { _, error } = attractionOrderSchema.validate(req.body);
      if (error) {
        return sendErrorResponse(res, 400, error.details[0].message);
      }

      let totalAmount = 0;
      let totalOffer = 0;
      for (let i = 0; i < selectedActivities?.length; i++) {
        if (!isValidObjectId(selectedActivities[i]?.activity)) {
          return sendErrorResponse(res, 400, "Invalid activity id");
        }

        const activity = await AttractionActivity.findOne({
          _id: selectedActivities[i]?.activity,
          isDeleted: false,
        });

        if (!activity) {
          return sendErrorResponse(res, 400, "Activity not found!");
        }

        const attraction = await Attraction.findOne({
          _id: activity.attraction,
          isDeleted: false,
          isActive: true,
        });
        if (!attraction) {
          return sendErrorResponse(res, 500, "Attraction not found!");
        }

        if (
          new Date(selectedActivities[i]?.date) <
          new Date(new Date().setDate(new Date().getDate() + 2))
        ) {
          return sendErrorResponse(
            res,
            400,
            `"selectedActivities[${i}].date" must be a valid date`
          );
        }

        if (
          attraction.isCustomDate === true &&
          (new Date(selectedActivities[i]?.date) <
            new Date(attraction?.startDate) ||
            new Date(selectedActivities[i]?.date) >
              new Date(attraction?.endDate))
        ) {
          return sendErrorResponse(
            res,
            400,
            `${
              activity?.name
            } is not avaialble on your date. Please select a date between ${new Date(
              attraction?.startDate
            )?.toDateString()} and ${new Date(
              attraction?.endDate
            )?.toDateString()} `
          );
        }

        const selectedDay =
          dayNames[new Date(selectedActivities[i]?.date).getDay()];

        const objIndex = attraction.availability?.findIndex((item) => {
          return item?.day?.toLowerCase() === selectedDay?.toLowerCase();
        });

        if (
          objIndex === -1 ||
          attraction.availability[objIndex]?.isEnabled === false
        ) {
          return sendErrorResponse(
            res,
            400,
            `Sorry, ${activity?.name} is off on ${selectedDay}`
          );
        }

        for (let j = 0; j < attraction.offDates?.length; j++) {
          const { from, to } = attraction.offDates[j];
          if (
            new Date(selectedActivities[i]?.date) >= new Date(from) &&
            new Date(selectedActivities[i]?.date) <= new Date(to)
          ) {
            return sendErrorResponse(
              res,
              400,
              `${activity?.name} is off between ${new Date(
                from
              )?.toDateString()} and ${new Date(to)?.toDateString()} `
            );
          }
        }

        if (attraction.bookingType === "ticket") {
          let adultTicketError = false;
          let childTicketError = false;
          const adultTickets = await AttractionTicket.find({
            activity: activity._id,
            status: "ok",
            ticketFor: "adult",
            $or: [
              {
                validity: true,
                validTill: {
                  $gte: new Date(selectedActivities[i]?.date).toISOString(),
                },
              },
              { validity: false },
            ],
          }).count();
          const childrenTickets = await AttractionTicket.find({
            activity: activity._id,
            status: "ok",
            ticketFor: "child",
            $or: [
              {
                validity: true,
                validTill: {
                  $gte: new Date(selectedActivities[i]?.date).toISOString(),
                },
              },
              { validity: false },
            ],
          }).count();

          if (adultTickets < Number(selectedActivities[i]?.adultsCount)) {
            adultTicketError = true;
          }

          if (childrenTickets < Number(selectedActivities[i]?.childrenCount)) {
            childTicketError = true;
          }

          if (adultTicketError || childTicketError) {
            return sendErrorResponse(
              res,
              500,
              `${adultTicketError && "Adult Tickets"} ${
                adultTicketError && childTicketError ? "and" : ""
              } ${childTicketError && "Child Tickets"} Sold Out`
            );
          }
        }

        let b2cMarkup = await B2CAttractionMarkup.findOne({
          attraction: attraction?._id,
        });

        let totalMarkup = 0;
        let price = 0;
        if (
          Number(selectedActivities[i]?.adultsCount) > 0 &&
          activity.adultPrice
        ) {
          price +=
            Number(selectedActivities[i]?.adultsCount) * activity.adultPrice;

          if (b2cMarkup) {
            let markup = 0;
            if (b2cMarkup.markupType === "flat") {
              markup = b2cMarkup.markup;
            } else {
              markup = (b2cMarkup.markup * activity.adultPrice) / 100;
            }
            price += markup * Number(selectedActivities[i]?.adultsCount);
            totalMarkup += markup * Number(selectedActivities[i]?.adultsCount);
          }
        }
        if (
          Number(selectedActivities[i]?.childrenCount) > 0 &&
          activity?.childPrice
        ) {
          price +=
            Number(selectedActivities[i]?.childrenCount) * activity?.childPrice;

          if (b2cMarkup) {
            let markup = 0;
            if (b2cMarkup.markupType === "flat") {
              markup = b2cMarkup.markup;
            } else {
              markup = (b2cMarkup.markup * activity.childPrice) / 100;
            }
            price += markup * Number(selectedActivities[i]?.childrenCount);
            totalMarkup += markup * Number(selectedActivities[i]?.adultsCount);
          }
        }
        if (
          Number(selectedActivities[i]?.infantCount) > 0 &&
          activity?.infantPrice
        ) {
          price +=
            Number(selectedActivities[i]?.infantCount) * activity?.infantPrice;

          if (b2cMarkup) {
            let markup = 0;
            if (b2cMarkup.markupType === "flat") {
              markup = b2cMarkup.markup;
            } else {
              markup = (b2cMarkup.markup * activity.infantCount) / 100;
            }

            price += markup * Number(selectedActivities[i]?.infantCount);
            totalMarkup += markup * Number(selectedActivities[i]?.adultsCount);
          }
        }

        let offer = 0;
        if (attraction?.isOffer) {
          if (attraction.offerAmountType === "flat") {
            offer = attraction.offerAmount;
          } else {
            offer = (price / 100) * attraction.offerAmount;
          }
        }

        price -= offer;
        if (price < 0) {
          price = 0;
        }

        if (attraction.bookingType === "booking") {
          let totalAdultPurchaseCost = 0;
          if (selectedActivities[i]?.adultsCount >= 1) {
            totalAdultPurchaseCost =
              (selectedActivities[i]?.adultsCount || 0) *
              (activity.adultCost || 0);
          }
          let totalChildPurchaseCost = 0;
          if (selectedActivities[i]?.childrenCount >= 1) {
            totalChildPurchaseCost =
              (selectedActivities[i]?.childrenCount || 0) *
              (activity.childCost || 0);
          }
          let totalInfantPurchaseCost = 0;
          if (selectedActivities[i]?.infantCount >= 1) {
            totalInfantPurchaseCost =
              (selectedActivities[i]?.infantCount || 0) *
              (activity.infantCost || 0);
          }

          let profit =
            price -
            (totalAdultPurchaseCost +
              totalChildPurchaseCost +
              totalInfantPurchaseCost);

          selectedActivities[i].profit = profit;
        }

        if (selectedActivities[i]?.transferType === "private") {
          if (activity.isTransferAvailable && activity.privateTransferPrice) {
            if (selectedActivities[i]?.adultsCount) {
              price +=
                Number(selectedActivities[i]?.adultsCount) *
                activity.privateTransferPrice;
            }
            if (selectedActivities[i]?.childrenCount) {
              price +=
                Number(selectedActivities[i]?.childrenCount) *
                activity.privateTransferPrice;
            }
          } else {
            return sendErrorResponse(
              res,
              400,
              `Private transfer not available for ${activity?.name}`
            );
          }
        }

        if (selectedActivities[i]?.transferType === "shared") {
          if (activity.isTransferAvailable && activity.sharedTransferPrice) {
            if (selectedActivities[i]?.adultsCount) {
              price +=
                Number(selectedActivities[i]?.adultsCount) *
                activity.sharedTransferPrice;
            }
            if (selectedActivities[i]?.childrenCount) {
              price +=
                Number(selectedActivities[i]?.childrenCount) *
                activity.sharedTransferPrice;
            }
          } else {
            return sendErrorResponse(
              res,
              400,
              `Shared Transfer not available for ${activity?.name}`
            );
          }
        }

        selectedActivities[i].amount = price;
        selectedActivities[i].attraction = attraction?._id;
        selectedActivities[i].offerAmount = offer;
        selectedActivities[i].status = "pending";
        selectedActivities[i].bookingType = attraction.bookingType;
        if (attraction.bookingType === "booking") {
          selectedActivities[i].adultCost = activity.adultCost;
          selectedActivities[i].childCost = activity.childCost;
          selectedActivities[i].infantCost = activity.infantCost;
        }
        totalAmount += price;
        totalOffer += offer;
      }

      let user;
      if (!req.user) {
        if (!isValidObjectId(country)) {
          return sendErrorResponse(res, 400, "Invalid country id");
        }

        const countryDetails = await Country.findOne({
          _id: country,
          isDeleted: false,
        });
        if (!countryDetails) {
          return sendErrorResponse(res, 400, "Country not found");
        }

        user = await User.findOne({ email });
        if (!user) {
          const password = crypto.randomBytes(6);
          user = new User({
            name,
            email,
            phoneNumber,
            country,
            password,
          });
          await user.save();
        }
      }

      let buyer = req.user || user;

      const newAttractionOrder = new AttractionOrder({
        activities: selectedActivities,
        totalAmount,
        totalOffer,
        user: buyer?._id,
        country,
        name,
        email,
        phoneNumber,
        orderStatus: "pending",
        referenceNumber: generateUniqueString("B2CATO"),
      });
      await newAttractionOrder.save();

      res.status(200).json(newAttractionOrder);
    } catch (err) {
      sendErrorResponse(res, 500, err);
    }
  },

  initiateAttractionOrderPayment: async (req, res) => {
    try {
      const { orderId } = req.params;
      const { paymentProcessor } = req.body;

      if (!isValidObjectId(orderId)) {
        return sendErrorResponse(res, 400, "Invalid order id");
      }

      const attractionOrder = await AttractionOrder.findById(orderId);
      if (!attractionOrder) {
        return sendErrorResponse(res, 404, "Attraction order not found");
      }

      if (attractionOrder.orderStatus === "completed") {
        return sendErrorResponse(
          res,
          400,
          "sorry, you have already completed this order"
        );
      }

      let totalAmount = attractionOrder.totalAmount;

      const newTransaction = new B2CTransaction({
        user: attractionOrder.user,
        amount: attractionOrder?.totalAmount,
        status: "pending",
        transactionType: "deduct",
        paymentProcessor,
        orderId: attractionOrder?._id,
      });
      await newTransaction.save();

      if (paymentProcessor === "paypal") {
        const currency = "USD";
        const totalAmountUSD = await convertCurrency(totalAmount, currency);
        console.log(totalAmountUSD);
        const response = await createOrder(totalAmountUSD, currency);

        if (response.statusCode !== 201) {
          return sendErrorResponse(
            res,
            400,
            "Something went wrong while fetching order! Please try again later"
          );
        }

        return res.status(200).json(response.result);
      } else if (paymentProcessor === "razorpay") {
        const currency = "INR";
        const totalAmountINR = await convertCurrency(totalAmount, currency);
        const options = {
          amount: totalAmountINR * 100,
          currency,
        };
        const order = await instance.orders.create(options);
        return res.status(200).json(order);
      } else if (paymentProcessor === "ccavenue") {
        let body = "";
        body += {
          merchant_id: process.env.CCAVENUE_MERCHANT_ID,
          order_id: attractionOrder?._id,
          currency: "AED",
          amount: Number(attractionOrder?.totalAmount),
          redirect_url: `${process.env.SERVER_URL}/api/v1/attractions/orders/ccavenue/capture`,
          cancel_url: `${process.env.SERVER_URL}/api/v1/attractions/orders/ccavenue/capture`,
          language: "EN",
        };
        let accessCode = process.env.CCAVENUE_ACCESS_CODE;

        const encRequest = ccav.encrypt(body);
        const formbody =
          '<form id="nonseamless" method="post" name="redirect" action="https://secure.ccavenue.ae/transaction/transaction.do?command=initiateTransaction"/> <input type="hidden" id="encRequest" name="encRequest" value="' +
          encRequest +
          '"><input type="hidden" name="access_code" id="access_code" value="' +
          accessCode +
          '"><script language="javascript">document.redirect.submit();</script></form>';

        res.setHeader("Content-Type", "text/html");
        res.write(formbody);
        res.end();
        return;
      } else {
        return sendErrorResponse(res, 400, "Invalid payment processor");
      }
    } catch (err) {
      sendErrorResponse(res, 500, err);
    }
  },

  capturePaypalAttractionPayment: async (req, res) => {
    try {
      const { paymentId, paymentOrderId, orderId } = req.body;

      // const { _, error } = attractionOrderCaptureSchema.validate(
      //     req.body
      // );
      // if (error) {
      //     return sendErrorResponse(res, 400, error.details[0].message);
      // }

      if (!isValidObjectId(orderId)) {
        return sendErrorResponse(res, 400, "invalid order id");
      }

      const attractionOrder = await AttractionOrder.findOne({
        _id: orderId,
      });
      if (!attractionOrder) {
        return sendErrorResponse(
          res,
          400,
          "Attraction order not found!. Please create an order first. Check with our team if amount is debited from your bank!"
        );
      }

      if (attractionOrder.orderStatus === "completed") {
        return sendErrorResponse(
          res,
          400,
          "This order already completed, Thank you. Check with our team if you paid multiple times."
        );
      }

      let transaction = await B2CTransaction.findOne({
        paymentProcessor: "paypal",
        orderId: attractionOrder?._id,
        status: "pending",
      });
      if (!transaction) {
        const transaction = new B2CTransaction({
          user: attractionOrder.user,
          amount: attractionOrder?.totalAmount,
          status: "pending",
          transactionType: "deduct",
          paymentProcessor: "paypal",
          orderId: attractionOrder?._id,
        });
        await transaction.save();
      }

      const orderObject = await fetchOrder(paymentOrderId);

      if (orderObject.statusCode === "500") {
        transaction.status = "failed";
        await transaction.save();

        return sendErrorResponse(
          res,
          400,
          "Error while fetching order status from paypal. Check with XYZ team if amount is debited from your bank!"
        );
      } else if (orderObject.status !== "COMPLETED") {
        transaction.status = "failed";
        await transaction.save();

        return sendErrorResponse(
          res,
          400,
          "Paypal order status is not Completed. Check with XYZ team if amount is debited from your bank!"
        );
      } else {
        const paymentObject = await fetchPayment(paymentId);

        if (paymentObject.statusCode == "500") {
          transaction.status = "failed";
          await transaction.save();

          return sendErrorResponse(
            res,
            400,
            "Error while fetching payment status from paypal. Check with XYZ team if amount is debited from your bank!"
          );
        } else if (paymentObject.result.status !== "COMPLETED") {
          transaction.status = "failed";
          await transaction.save();

          return sendErrorResponse(
            res,
            400,
            "Paypal payment status is not Completed. Please complete your payment!"
          );
        }
      }

      transaction.status = "success";
      await transaction.save();
      attractionOrder.isPaid = true;
      await attractionOrder.save();

      await completeOrderAfterPayment(attractionOrder);

      attractionOrder.orderStatus = "completed";
      await attractionOrder.save();

      return res.status(200).json({
        message: "Transaction Successful",
      });
    } catch (error) {
      console.log(error);
      return sendErrorResponse(
        res,
        400,
        "Payment processing failed! If money is deducted contact team, else try again!"
      );
    }
  },

  captureCCAvenueAttractionPayment: async (req, res) => {
    try {
      let ccavEncResponse = "";
      ccavEncResponse += req.body;

      const ccavPOST = qs.parse(ccavEncResponse);
      const encryption = ccavPOST.encResp;
      const ccavResponse = ccav.decrypt(encryption);

      const attractionOrder = await AttractionOrder.findOne({
        _id: req.body?.order_id,
      });
      if (!attractionOrder) {
        return sendErrorResponse(res, 404, "Attraction order not found");
      }

      let pData = "";
      pData = "<table border=1 cellspacing=2 cellpadding=2><tr><td>";
      pData = pData + ccavResponse.replace(/=/gi, "</td><td>");
      pData = pData.replace(/&/gi, "</td></tr><tr><td>");
      pData = pData + "</td></tr></table>";
      const htmlcode =
        '<html><head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"><title>Response Handler</title></head><body><center><font size="4" color="blue"><b>Response Page</b></font><br>' +
        pData +
        "</center><br></body></html>";
      res.writeHeader(200, { "Content-Type": "text/html" });
      res.write(htmlcode);
      res.end();
    } catch (err) {
      console.log(err);
      sendErrorResponse(res, 500, err);
    }
  },

  captureRazorpayAttractionPayment: async (req, res) => {
    try {
      const { razorpay_order_id, transactionid, razorpay_signature, orderId } =
        req.body;

      if (!isValidObjectId(orderId)) {
        return sendErrorResponse(res, 400, "invalid order id");
      }

      const attractionOrder = await AttractionOrder.findOne({
        _id: orderId,
      });
      if (!attractionOrder) {
        return sendErrorResponse(
          res,
          400,
          "Attraction order not found!. Please create an order first. Check with our team if amount is debited from your bank!"
        );
      }

      if (attractionOrder.orderStatus === "completed") {
        return sendErrorResponse(
          res,
          400,
          "This order already completed, Thank you. Check with our team if you paid multiple times."
        );
      }

      let transaction = await B2CTransaction.findOne({
        paymentProcessor: "razorpay",
        orderId: attractionOrder?._id,
        status: "pending",
      });
      if (!transaction) {
        const newTransaction = new B2CTransaction({
          user: attractionOrder.user,
          amount: attractionOrder?.totalAmount,
          status: "pending",
          transactionType: "deduct",
          paymentProcessor: "razorpay",
          orderId: attractionOrder?._id,
        });
        await newTransaction.save();
      }

      const generated_signature = crypto.createHmac(
        "sha256",
        process.env.RAZORPAY_KEY_SECRET
      );
      generated_signature.update(razorpay_order_id + "|" + transactionid);

      if (generated_signature.digest("hex") !== razorpay_signature) {
        transaction.status = "failed";
        await transaction.save();
        attractionOrder.orderStatus = "failed";
        await attractionOrder.save();

        return sendErrorResponse(res, 400, "Transaction failed");
      }

      transaction.status = "success";
      await transaction.save();
      attractionOrder.isPaid = true;
      await attractionOrder.save();

      await completeOrderAfterPayment(attractionOrder);

      attractionOrder.orderStatus = "completed";
      await attractionOrder.save();

      return res.status(200).json({
        message: "Transaction Successful",
      });
    } catch (err) {
      sendErrorResponse(res, 400, err);
    }
  },

  getSingleAttractionOrder: async (req, res) => {
    try {
      const { id } = req.params;

      if (!isValidObjectId(id)) {
        return sendErrorResponse(res, 400, "Invalid attraction id");
      }

      const attractionOrder = await AttractionOrder.findById(id)
        .populate("orders.activity")
        .populate("attraction", "title isOffer offerAmount offerAmountType")
        .lean();
      if (!attractionOrder) {
        return sendErrorResponse(res, 400, "Attraction not found");
      }

      res.status(200).json(attractionOrder);
    } catch (err) {
      sendErrorResponse(res, 500, err);
    }
  },

  cancelAttractionOrder: async (req, res) => {
    try {
      const { orderId, orderItemId } = req.body;

      if (!isValidObjectId(orderId)) {
        return sendErrorResponse(res, 400, "invalid order id");
      }

      if (!isValidObjectId(orderItemId)) {
        return sendErrorResponse(res, 400, "invalid order item id");
      }

      // check order available or not
      const order = await AttractionOrder.findOne(
        {
          _id: orderId,
          user: req.user?._id,
        },
        { activities: { $elemMatch: { _id: orderItemId } } }
      );

      if (!order || order?.activities?.length < 1) {
        return sendErrorResponse(res, 400, "order not found");
      }

      const attraction = await Attraction.findById(
        order.activities[0].attraction
      );
      if (!attraction) {
        return sendErrorResponse(res, 400, "attraction not found");
      }

      // check if it's status is booked or confirmed
      if (
        order.activities[0].status !== "booked" &&
        order.activities[0].status !== "confirmed"
      ) {
        return sendErrorResponse(
          res,
          400,
          "you cantn't canel this order. order already cancelled or not completed the order"
        );
      }

      // check if it's ok for cancelling with cancellation policy
      if (attraction.cancellationType === "nonRefundable") {
        return sendErrorResponse(
          res,
          400,
          "sorry, this order is non refundable"
        );
      }

      if (
        new Date(order.activities[0].date).setHours(0, 0, 0, 0) <=
        new Date().setDate(0, 0, 0, 0)
      ) {
        return sendErrorResponse(
          res,
          400,
          "sorry, you cant't cancel the order after the activity date"
        );
      }

      let orderAmount = order.activities[0].amount;
      let cancellationFee = 0;
      let cancelBeforeDate = new Date(
        new Date(order.activities[0].date).setHours(0, 0, 0, 0)
      );
      cancelBeforeDate.setHours(
        cancelBeforeDate.getHours() - attraction.cancelBeforeTime
      );

      if (attraction.cancellationType === "freeCancellation") {
        if (new Date().setHours(0, 0, 0, 0) < cancelBeforeDate) {
          cancellationFee = 0;
        } else {
          cancellationFee = (orderAmount / 100) * attraction.cancellationFee;
        }
      } else if (attraction.cancellationType === "cancelWithFee") {
        if (new Date().setHours(0, 0, 0, 0) < cancelBeforeDate) {
          cancellationFee = (orderAmount / 100) * attraction.cancellationFee;
        } else {
          cancellationFee = totalAmount;
        }
      } else {
        return sendErrorResponse(res, 400, "sorry, cancellation failed");
      }

      // Update tickets state to back
      if (order.activities[0].bookingType === "ticket") {
        await AttractionTicket.find({
          activity: order.activities[0].activity,
          ticketNo: { $all: order.activities[0].adultTickets },
        }).updateMany({ status: "ok" });
        await AttractionTicket.find({
          activity: order.activities[0].activity,
          ticketNo: { $all: order.activities[0].childTickets },
        }).updateMany({ status: "ok" });
        await AttractionTicket.find({
          activity: order.activities[0].activity,
          ticketNo: { $all: order.activities[0].infantTickets },
        }).updateMany({ status: "ok" });
      }

      // Refund the order amount after substracting fee
      await AttractionOrder.findOneAndUpdate(
        {
          _id: orderId,
          "activities._id": orderItemId,
          user: req.user?._id,
        },
        {
          "activities.$.status": "cancelled",
          "activities.$.cancelledBy": "user",
          "activities.$.cancellationFee": cancellationFee,
          "activities.$.refundAmount": orderAmount - cancellationFee,
          "activities.$.isRefundAvailable": true,
        },
        { runValidators: true }
      );

      res.status(200).json({
        message: "you have successfully cancelled the order",
      });
    } catch (err) {
      sendErrorResponse(res, 500, err);
    }
  },

  getSingleUserAllOrders: async (req, res) => {
    try {
      const { result, skip, limit } = await getUserOrder({
        ...req.query,
        userId: req.user?._id,
      });

      res.status(200).json({ result, skip, limit });
    } catch (err) {
      sendErrorResponse(res, 500, err);
    }
  },
};
