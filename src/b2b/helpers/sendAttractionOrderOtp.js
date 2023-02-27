const { sendEmail } = require("../../helpers");
const commonFooter = require("../../helpers/commonFooter");

const sendAttractionOrderOtp = async (email, subject, otp) => {
    try {
        const footerHtml = await commonFooter();

        sendEmail(
            email,
            subject,
            `<div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2">
            <div style="margin:50px auto;width:70%;padding:20px 0">
              <div style="border-bottom:1px solid #eee">
                <a href="" style="font-size:1.4em;color: #00466a;text-decoration:none;font-weight:600">Travellers Choice</a>
              </div>
              <p style="font-size:1.1em">Hi,</p>
              <p>Thank you for choosing Travellers Choice. Use the following OTP and  complete your Attraction Order procedures</p>
              <p style="margin: 0 auto;width: max-content;padding: 0 10px;"> OTP</p>
              <h2 style="background: #00466a;margin: 0 auto;width: max-content;padding: 0 10px;color: #fff;border-radius: 4px;">${otp} </h2>
              

                         ${footerHtml}

            </div>
         `
        );
    } catch (err) {
        console.log(err);
    }
};

module.exports = sendAttractionOrderOtp;
