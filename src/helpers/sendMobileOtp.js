const twilio = require("twilio");
const getOtpSettings = require("./getOtpSettings");

const sendMobileOtp = async ({ phonecode, mobileNumber }) => {
    try {
        const otpSettings = await getOtpSettings();
        if (!otpSettings) {
            throw new Error("Something went wrong, Try again.");
        }
        console.log(otpSettings);
        // const randomOtp = Math.floor(Math.random() * (99999 - 10000)) + 10000;
        const randomOtp = 11111;
        const client = twilio(
            otpSettings?.twilioSID,
            otpSettings?.twilioAuthToken
        );

        // client.messages
        //     .create({
        //         from: "+13862603921",
        //         to: `+${phonecode} ${mobileNumber}`,
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
