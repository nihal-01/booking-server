const {
    dubaiParkAuhthentication,
} = require("../../admin/helpers/dubaiParkAuth");

module.exports = {
    createDubaiParkOrder: async (apiId, attractionOrder, activity) => {
        try {
            const token = await dubaiParkAuhthentication(apiId);

            const url =
                "https://am-uat.dubaiparksandresorts.com/wso2/sec/services/dpr/resellerBooking/1.0.0";

            const headers = {
                Source: "TRAVELLERS_CHOICE",
                Channel: "Web Portal",
                "Web-Client": "postman",
                "Content-Type": "application/json",
                Authorization: "Bearer " + token,
            };

            const data = {
                productList: [
                    {
                        productId: activity.productId,
                        quantity: Number(
                            activity.adultCount + activity.childCount
                        ),
                    },
                ],
                resellerBookingId: "TRAVELLERS_CHOICE_13022023",
                CustomerInfo: {
                    firstName: attractionOrder.name,
                    lastName: attractionOrder.name,
                    emailAddress: attractionOrder.email,
                    mobilePhoneNumber: attractionOrder.phoneNumber,
                    fixedPhoneNumber: attractionOrder.phoneNumber,
                    address: "Test Address",
                    residenceCountry: "AE",
                    city: "Test City",
                    zipCode: "00111",
                },
                paymentMethod: {
                    paymentMethodId: 12,
                    paymentDate: "13/02/2023 10:50:25",
                    TransactionCode: "93447112529598613",
                },
            };

            console.log("call reached ", attractionOrder);

            // let response = await axios.post(url, data, { headers });

            // return response.data.data
        } catch (err) {}
    },
};
