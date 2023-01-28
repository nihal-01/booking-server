const twilio = require("twilio");

// const TWILIO_SID = 
// const TWILIO_AUTH_TOKEN = 

const sendMobileOtp = async ({ phonecode, phoneNumber }) => {
    try {
        // const randomOtp = Math.floor(Math.random() * (99999 - 10000)) + 10000;
        const randomOtp = 12345;
        // const client = twilio(
        //     TWILIO_SID,
        //     TWILIO_AUTH_TOKEN
        // );

        // client.messages
        //     .create({
        //         from: "+13862603921",
        //         to: `+${phonecode} ${phoneNumber}`,
        //         body: `Your Hamipay verification code is ${randomOtp}. Don't share this code with anyone, our employees never ask for the code.`,
        //     })
        //     .then((message) => {
        //         console.log("otp has sent" + message);
        //     })
        //     .catch((err) => {
        //         console.log(err?.message);
        //     });

        return randomOtp;
    } catch (err) {
        throw new Error(err);
    }
};

module.exports = sendMobileOtp;
