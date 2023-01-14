const paypal = require("@paypal/checkout-server-sdk");

const getClient = () => {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    let environment;
    if (process.env.NODE_ENV === "production") {
        environment = new paypal.core.LiveEnvironment(clientId, clientSecret);
    } else {
        environment = new paypal.core.SandboxEnvironment(
            clientId,
            clientSecret
        );
    }
    const client = new paypal.core.PayPalHttpClient(environment);
    return client;
};

const createOrder = async (amount, currency) => {
    const client = getClient();
    const request = new paypal.orders.OrdersCreateRequest();
    request.requestBody({
        intent: "CAPTURE",
        purchase_units: [
            {
                amount: {
                    currency_code: currency,
                    value: amount,
                    breakdown: {
                        item_total: {
                            currency_code: currency,
                            value: amount,
                        },
                    },
                },
                items: [
                    {
                        name: "Item Name",
                        unit_amount: {
                            currency_code: currency,
                            value: amount,
                        },
                        quantity: "1",
                        /*
                         * category is an ENUM with following possible values:
                         *    DIGITAL_GOODS,
                         *    PHYSICAL_GOODS,
                         *    DONATION
                         *
                         * More Details here: https://developer.paypal.com/docs/api/orders/v2/#:~:text=possible%20values%20are%3A-,DIGITAL_GOODS,-.%20Goods%20that%20are
                         *
                         */
                        category: "DIGITAL_GOODS",
                    },
                ],
            },
        ],
    });
    

    const response = await client.execute(request);
    console.log(response , "response")
    return response;
};

const fetchPayment = async function (paymentId) {
    try {
        const client = getClient();
        const requestPayment = new paypal.payments.CapturesGetRequest(
            paymentId
        );
        const responsePayment = await client.execute(requestPayment);
        return responsePayment;
    } catch (err) {
        return { statusCode: "500", status: "ERROR", error: err };
    }
};

const fetchOrder = async function (orderId) {
    try {
        const client = getClient();
        const requestCapture = new paypal.orders.OrdersGetRequest(orderId);
        const responseCapture = await client.execute(requestCapture);
        return {
            statusCode: responseCapture.statusCode,
            status: responseCapture.result.status,
        };
    } catch (err) {
        return { statusCode: "500", status: "PENDING" };
    }
};

module.exports = { createOrder, fetchOrder, fetchPayment };
