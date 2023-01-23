const { isValidObjectId } = require("mongoose");
const crypto = require("crypto");
const { b2bAttractionOrderSchema } = require("../validations/b2bAttractionOrder.schema");
const { sendErrorResponse } = require("../../helpers");
const { Attraction, AttractionActivity } = require("../../models");
const { B2BClientAttractionMarkup, B2BSubAgentAttractionMarkup } = require("../models");




const dayNames = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
];



module.exports = {
    // TODO
    // 1. VAT Calculation
    // 2. Send password for new emails
    // 3. Verify Mobile Number
    createAttractionOrder: async (req, res) => {
        try {
            const { selectedActivities} =
                req.body;

            const { _, error } = b2bAttractionOrderSchema.validate(req.body);
            if (error) {
                return sendErrorResponse(res, 400, error.details[0].message);
            }
            console.log(req.reseller , "reseller")

            let totalAmount = 0;
            let totalOffer = 0;
            let resellerMarkupAmount = 0;
            let subAgentMarkupAmount = 0
            let  resellertotalMarkupAmount = 0
            let  subAgenttotalMarkupAmount = 0

        
            for (let i = 0; i < selectedActivities?.length; i++) {
                if (!isValidObjectId(selectedActivities[i]?.activity)) {
                    return sendErrorResponse(res, 400, "Invalid activity id");
                }

                const activity = await AttractionActivity.findOne({
                    _id: selectedActivities[i]?.activity,
                    isDeleted: false,
                });

                console.log(activity , "activity")

                if (!activity) {
                    return sendErrorResponse(res, 400, "Activity not found!");
                }

                const attraction = await Attraction.findOne({
                    _id: activity.attraction,
                    isDeleted: false,
                });
                if (!attraction) {
                    return sendErrorResponse(res, 500, "Attraction not found!");
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
                    return (
                        item?.day?.toLowerCase() === selectedDay?.toLowerCase()
                    );
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
                        new Date(selectedActivities[i]?.date) >=
                            new Date(from) &&
                        new Date(selectedActivities[i]?.date) <= new Date(to)
                    ) {
                        return sendErrorResponse(
                            res,
                            400,
                            `${activity?.name} is off between ${new Date(
                                from
                            )?.toDateString()} and ${new Date(
                                to
                            )?.toDateString()} `
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
                                    $gte: new Date(
                                        selectedActivities[i]?.date
                                    ).toISOString(),
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
                                    $gte: new Date(
                                        selectedActivities[i]?.date
                                    ).toISOString(),
                                },
                            },
                            { validity: false },
                        ],
                    }).count();

                    if (
                        adultTickets <
                        Number(selectedActivities[i]?.adultsCount)
                    ) {
                        adultTicketError = true;
                    }

                    if (
                        childrenTickets <
                        Number(selectedActivities[i]?.childrenCount)
                    ) {
                        childTicketError = true;
                    }

                    if (adultTicketError || childTicketError) {
                        return sendErrorResponse(
                            res,
                            500,
                            `${adultTicketError && "Adult Tickets"} ${
                                adultTicketError && childTicketError
                                    ? "and"
                                    : ""
                            } ${childTicketError && "Child Tickets"} Sold Out`
                        );
                    }
                }

                let price = 0;
                let reseller = {}
                let markup = 0
                let subAgent = {}
                let profitReseller
                let profitSubAgent
                reseller.totalAdultPrice =  0 ;
                subAgent.totalAdultPrice = 0;
                reseller.totalChildPrice =  0 ;
                subAgent.totalChildPrice = 0;
                reseller.totalInfantPrice =  0 ;
                subAgent.totalInfantPrice = 0;
                    
            
                if( req.reseller.role == "sub-agent"){
                  

                    console.log(req.reseller.referredBy,activity.attraction , "hiii")
                   
                   let  resellerMarkUP = await B2BSubAgentAttractionMarkup.findOne({

                    resellerId : req.reseller.referredBy,
                    attraction : activity.attraction
                   })
                   console.log(resellerMarkUP , "resellerMarkUP")

                 reseller.markupType = resellerMarkUP?.markupType ? resellerMarkUP?.markupType  : "flat"
                 reseller.markup = resellerMarkUP?.markup  ? resellerMarkUP?.markup  : 0
                 
                 if (reseller?.markupType == 'percentage'){

                    console.log(activity.infantPrice,reseller.markup , "lll")
                    
                    reseller.adultPrice  = ( activity.adultPrice* reseller?.markup) /100
                    reseller.childPrice  = ( activity.childPrice* reseller?.markup) /100
                    reseller.infantPrice  = ( activity.infantPrice* reseller?.markup) /100


                }
                
                if( reseller?.markupType == "flat"){

                    reseller.adultPrice  =  reseller.markup
                    reseller.childPrice = reseller.markup
                    reseller.infantPrice  = reseller.markup
                    
                    
                }
                console.log(reseller.adultPrice , reseller.infantPrice , "reseller.adultPrice klklkl")
           
                

                   
                    let  subAgentMarkUP = await B2BClientAttractionMarkup.findOne({
 
                     resellerId : req.reseller._id,
                     attraction : activity.attraction
                    })

                    
                    subAgent.markupType = subAgentMarkUP?.markupType ? subAgentMarkUP?.markupType : "flat"
                    subAgent.markup= subAgentMarkUP?.markup ? subAgentMarkUP?.markup : 0
                    
                    console.log(subAgentMarkUP , subAgent.markupType, subAgent.markup ,  "subAgentMarkUP")
                  
                 if ( subAgentMarkUP && subAgent.markupType == 'percentage'){

                    console.log(reseller.adultPrice , "reseller.adultPrice")
                    
                    subAgent.adultPrice  = ( (activity.adultPrice + reseller.adultPrice) *  subAgent.markup) /100

                    subAgent.childPrice  = ( (activity.childPrice + reseller.childPrice) * subAgent.markup) /100
                    subAgent.infantPrice  = (  (activity.infantPrice + reseller.infantPrice) *  subAgent.markup) /100


                }
                 if( subAgent?.markupType == "flat"){
                     
                     
                     subAgent.adultPrice  =  subAgent?.markup
                     subAgent.childPrice =  subAgent?.markup
                     subAgent.infantPrice =  subAgent?.markup
                     
                     console.log(subAgent.adultPrice , subAgent.infant , "reseller.adultPrice")

                 }
 
                 }


                if (selectedActivities[i]?.adultsCount && activity.adultPrice) {
                    price +=
                        Number(selectedActivities[i]?.adultsCount) *
                        (activity.adultPrice +    subAgent?.adultPrice +   reseller.adultPrice   ) ;

                    reseller.totalAdultPrice   +=  Number(selectedActivities[i]?.adultsCount) * reseller.adultPrice;
                    subAgent.totalAdultPrice   +=  Number(selectedActivities[i]?.adultsCount) * subAgent.adultPrice ;

                    
                }
                console.log(price ,"price")
                if (
                    selectedActivities[i]?.childrenCount &&
                    activity?.childPrice
                ) {
                    

                    price +=
                    Number(selectedActivities[i]?.childrenCount) *
                    (activity.childPrice +    subAgent.childPrice  +   reseller.childPrice   ) ;

                reseller.totalChildPrice   +=  Number(selectedActivities[i]?.adultsCount) * reseller.childPrice
                subAgent.totalChildPrice   +=  Number(selectedActivities[i]?.adultsCount) * subAgent.childPrice

                console.log("reached2")
                console.log(price ,"price")


                }
                if (
                    selectedActivities[i]?.infantCount &&
                    activity?.infantPrice
                ) {
                     
                    console.log(activity.infantPrice , subAgent.infantPrice,  reseller.infantPrice  ,"infantPrice")
                    
                
                 price +=
                    Number(selectedActivities[i]?.infantCount) *
                    (activity.infantPrice +    subAgent.infantPrice +   reseller.infantPrice ) ;

                reseller.totalInfantPrice   +=  Number(selectedActivities[i]?.infantCount) * reseller.infantPrice
                subAgent.totalInfantPrice   +=  Number(selectedActivities[i]?.infantCount) * subAgent.infantPrice
                
                   console.log("reached")
                }
                console.log(price ,"price")

                console.log(price ,  reseller.totalInfantPrice , subAgent.totalInfantPrice ,  reseller.totalChildPrice ,reseller.infantPrice , "kkljhsd")


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

                     profitReseller =(
                        reseller.totalInfantPrice  +                            
                        reseller.totalChildPrice  +                           
            reseller.totalAdultPrice )
            
                selectedActivities[i].profitReseller = profitReseller;
                
                console.log("hiiii" , profitReseller ,reseller.totalInfantPrice  ,                            
                reseller.totalChildPrice  ,                          
    reseller.totalAdultPrice , subAgent.totalInfantPrice  ,  subAgent.totalAdultPrice , subAgent.totalChildPrice )
                 profitSubAgent =
                    
                    (subAgent.totalInfantPrice +
                        subAgent.totalAdultPrice +
                        subAgent.totalChildPrice)
    
                selectedActivities[i].profitSubAgent = profitSubAgent;

                    let profit =
                        price -
                        (totalAdultPurchaseCost +
                            totalChildPurchaseCost +
                            totalInfantPurchaseCost) - profitSubAgent - profitReseller

                    selectedActivities[i].profit = profit;

                    
                   
                }

                if (selectedActivities[i]?.transferType === "private") {
                    if (
                        activity.isTransferAvailable &&
                        activity.privateTransferPrice
                    ) {
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
                    if (
                        activity.isTransferAvailable &&
                        activity.sharedTransferPrice
                    ) {
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
                resellertotalMarkupAmount += profitReseller
                subAgenttotalMarkupAmount += profitSubAgent;
            }
            


            console.log(totalAmount,resellertotalMarkupAmount ,selectedActivities,"kkkk",  subAgenttotalMarkupAmount  )
           

            // let buyer = req.reseller || user;

            // const newAttractionOrder = new AttractionOrder({
            //     activities: selectedActivities,
            //     totalAmount,
            //     totalOffer,
            //     reseller: buyer?._id,
            //     country,
            //     name,
            //     email,
            //     phoneNumber,
            //     orderStatus: "pending",
            // });
            // await newAttractionOrder.save();

            // res.status(200).json(result);
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    initiateAttractionOrderPayment: async (req, res) => {
        try {
            const { orderId } = req.params;
            const { paymentProcessor, useWallet } = req.body;

            if (!isValidObjectId(orderId)) {
                return sendErrorResponse(res, 400, "Invalid order id");
            }

            const attractionOrder = await AttractionOrder.findById(orderId);
            if (!attractionOrder) {
                return sendErrorResponse(
                    res,
                    404,
                    "Attraction order not found"
                );
            }

            let totalAmount = attractionOrder.totalAmount;

            // taking wallet balance if allowed
            if (useWallet === true && req.user) {
                const wallet = await B2CWallet.findOne({ _id: req.user?._id });
                if (wallet && wallet.balance > 0) {
                    // deducting amount from user's wallet
                    let amount =
                        totalAmount > wallet.balance
                            ? totalAmount - wallet.balance
                            : totalAmount;
                    totalAmount -= amount;

                    const transaction = new B2CTransaction({
                        user: attractionOrder.user,
                        transactionType: "deduct",
                        status: "pending",
                        paymentProcessor: "wallet",
                        amount,
                    });
                    await transaction.save();
                }
            }

            if (totalAmount > 0 && !paymentProcessor) {
                return sendErrorResponse(
                    res,
                    400,
                    "Insufficient balance in wallet. Please select a payment processor."
                );
            }

            if (paymentProcessor === "paypal") {
                const currency = "USD";
                const response = await createOrder(totalAmount, currency);

                if (response.statusCode !== 201) {
                    return sendErrorResponse(
                        res,
                        400,
                        "Something went wrong while fetching order! Please try again later"
                    );
                }

                return res.status(200).json(response.result);
            } else if (paymentProcessor === "razorpay") {
                const options = {
                    amount: totalAmount * 100,
                    currency: "INR",
                };
                const order = await instance.orders.create(options);
                return res.status(200).json(order);
            } else {
                return sendErrorResponse(res, 400, "Invalid payment processor");
            }
        } catch (err) {
            sendErrorResponse(res, 500, err);
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
                .populate(
                    "attraction",
                    "title isOffer offerAmount offerAmountType"
                )
                .lean();
            if (!attractionOrder) {
                return sendErrorResponse(res, 400, "Attraction not found");
            }

            res.status(200).json(attractionOrder);
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },
};
