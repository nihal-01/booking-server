const {
    dubaiParkAuhthentication,
} = require("../../admin/helpers/dubaiParkAuth");
const axios = require("axios");

module.exports = {
    createDubaiParkOrder: async (apiId, attractionOrder, activity) => {
        try {
            const token = await dubaiParkAuhthentication(apiId);

            console.log(token, "token");
            const currentDate = new Date();
            const formattedDate = currentDate.toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
            });
            const formattedTime = currentDate.toLocaleTimeString("en-GB", {
                hour12: false,
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
            });
            const formattedDateTime = `${formattedDate} ${formattedTime}`;

            const url =
                "https://am.dubaiparksandresorts.com/wso2/sec/services/dpr/resellerBooking/1.0.0";

            const headers = {
                Source: "TRAVELLERS_CHOICE",
                Channel: "Web Portal",
                "Web-Client": "postman",
                "Content-Type": "application/json",
                Authorization: "Bearer " + token,
            };

            console.log(activity.activity, "activity ", activity.adultsCount);
            const data = {
                productList: [
                    {
                        productId: activity.activity.productId,
                        quantity:
                            Number(activity.adultsCount) +
                            Number(activity.childrenCount),
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
                    paymentDate: formattedDateTime,
                    TransactionCode: attractionOrder.referenceNumber,
                },
            };

            console.log("call reached ", attractionOrder);

            // let response = await axios.post(url, data, { headers });

            // console.log(response.data, "data recieved");

            // return response.data.data;

            return {
                PNR: "PXEDVP3J",
                MediaCodeList: [
                    {
                        ProductId: "42E90CEA-55AA-94A3-2029-017E67C0790F",
                        MediaCode: "1S7DJ8P62X6X3X",
                    },
                    {
                        ProductId: "42E90CEA-55AA-94A3-2029-017E67C0790F",
                        MediaCode: "1S7DJ8P62ASDFERT",
                    },
                ],
            };
        } catch (err) {
            console.log(err.message, "message");
        }
    },
};
