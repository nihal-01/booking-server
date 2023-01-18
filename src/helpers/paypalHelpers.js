const sendErrorResponse = require("./sendErrorResponse");

const capturePaypalOrder = async (orderId, paymentId) => {
    try {
        const orderObject = await fetchOrder(orderId);

        if (orderObject.statusCode == "500") {
            return sendErrorResponse(
                res,
                400,
                "Error while fetching order status from paypal. Check with XYZ team if amount is debited from your bank!"
            );
        } else if (orderObject.status !== "COMPLETED") {
            return sendErrorResponse(
                res,
                400,
                "Paypal order status is not Completed. Check with XYZ team if amount is debited from your bank!"
            );
        } else {
            const paymentObject = await fetchPayment(paymentId);

            if (paymentObject.statusCode == "500") {
                return sendErrorResponse(
                    res,
                    400,
                    "Error while fetching payment status from paypal. Check with XYZ team if amount is debited from your bank!"
                );
            } else if (paymentObject.result.status !== "COMPLETED") {
                return sendErrorResponse(
                    res,
                    400,
                    "Paypal payment status is not Completed. Please complete your payment!"
                );
            }
        }
    } catch (err) {
        throw err;
    }
};
