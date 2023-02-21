const { sendEmail } = require("../../helpers");
const commonFooter = require("../../helpers/commonFooter");

const sendWalletDeposit = (reseller, transaction, companyDetails) => {
  try {
    const footerHtml = commonFooter();

    sendEmail(
      reseller.email,
      "Account Credit Notification",
      `<div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2">
      <div style="margin:50px auto;width:70%;padding:20px 0">
        <div style="border-bottom:1px solid #eee">
          <a href="" style="font-size:1.4em;color: #00466a;text-decoration:none;font-weight:600">Travellers Choice</a>
        </div>
        <p style="font-size:1.1em">Hi,</p>
          <body style="font-family: Arial, sans-serif;">
        <h2 style="text-align: center;">Dear ${reseller.name},</h2>
        <p style="margin: 20px 0;"> We are pleased to inform you that an amount of ${
          transaction?.totalAmount
        }AED has been credited to your B2B account  on ${new Date()}  ${
        transaction.paymentMethod
      } .
        </p>
        <p style="margin: 20px 0;"> As a valued customer of Travellers Choice, we always strive to provide you with the best experience.

        </p>
        <p style="margin: 20px 0;"> We request you to kindly check your account balance and verify the transaction. In case of any discrepancy or clarification, please feel free to contact our customer service team.
        </p>
        <p style="margin: 20px 0;"> Thank you for choosing Travellers Choice  as your Travel Partner partner. We look forward to serving you in the future.
        </p>
        ${footerHtml}
        </body>
      </div>
    </div>
         `
    );
  } catch (err) {
    console.log(err);
  }
};

module.exports = sendWalletDeposit;
