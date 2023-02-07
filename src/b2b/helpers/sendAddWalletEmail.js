const nodemailer = require("nodemailer");

const   SendaddWalletEmail = async (email, subject, amount) => {
    try {
      

        sendEmail(
            email,
            subject,
            `<div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2">
            <div style="margin:50px auto;width:70%;padding:20px 0">
              <div style="border-bottom:1px solid #eee">
                <a href="" style="font-size:1.4em;color: #00466a;text-decoration:none;font-weight:600">Travellers Choice</a>
              </div>
              <p style="font-size:1.1em">Hi,</p>
              <p>Thank you for choosing Travellers Choice. </p>
              <p>Congratulation ${amount} has been credited to your wallet </p>
              <p style="font-size:0.9em;">Regards,<br />Travellers Choice</p>
              <hr style="border:none;border-top:1px solid #eee" />
              <div style="float:right;padding:8px 0;color:#aaa;font-size:0.8em;line-height:1;font-weight:300">
                <p>Travellers Choice Inc</p>
                <p>1600 Avenue Street </p>
                <p>Dubai</p>
              </div>
            </div>
         `

        )
    } catch (error) {
        console.log(error);
        console.log("E-mail not sent");
    }
};

module.exports = SendaddWalletEmail;