const Stripe = require("stripe");

const createOrder = async () => {
    try {
        const stripe = Stripe("YOUR_STRIPE_SECRET_KEY");

        let session;

        try {
            session = await stripe.checkout.sessions.create({
                client_reference_id: clientReferenceId,
                customer_email: customerEmail,
                payment_method_types: ["card"],
                line_items: [lineItem],
                payment_intent_data: {
                    description: `${lineItem.name} ${lineItem.description}`,
                },
                success_url: successUrl,
                cancel_url: cancelUrl,
            });
        } catch (error) {
            res.status(500).send({ error });
        }

        return res.status(200).send(session);
    } catch (err) {
        console.log(err);
    }
};

const verifiyPayment = async (req, res) => {
    try {
        const stripe = Stripe("YOUR_STRIPE_SECRET_KEY");

        let event;

        try {
            event = stripe.webhooks.constructEvent(
                req.rawBody,
                req.headers["stripe-signature"],
                "YOUR_STRIPE_WEBHOOK_SECRET"
            );
        } catch (error) {
            return res.status(400).send(`Webhook Error: ${error.message}`);
        }

        if (event.type === "checkout.session.completed") {
            const session = event.data.object;

            try {
                // complete your customer's order
                // e.g. save the purchased product into your database
                // take the clientReferenceId to map your customer to a product
            } catch (error) {
                return res.status(404).send({ error, session });
            }
        }

        return res.status(200).send({ received: true });
    } catch (err) {
        console.log(err);
    }
};

module.exports = { createOrder, verifiyPayment };
