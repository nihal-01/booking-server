const { sendEmail } = require("../../helpers");

const sendWalletDeposit = (reseller, transaction, companyDetails) => {
  try {
    sendEmail(
      reseller.email,
      "Amount Deposited",
      `<div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2">
      <div style="margin:50px auto;width:70%;padding:20px 0">
        <div style="border-bottom:1px solid #eee">
          <a href="" style="font-size:1.4em;color: #00466a;text-decoration:none;font-weight:600">Travellers Choice</a>
        </div>
        <p style="font-size:1.1em">Hi,</p>
          <body style="font-family: Arial, sans-serif;">
        <h2 style="text-align: center;">Dear ${reseller.name},</h2>
        <p style="margin: 20px 0;">This is an automated notification to inform you that an amount of ${
          transaction?.totalAmount
        }AED has been credited  to your wallet on ${new Date()}. This credited was made for the following transaction: ${
        transaction?.paymentOrderId
      }.</p>
        <p style="margin: 20px 0;">Please log in to your account to view the details of this transaction and your updated wallet balance. If you have any questions or concerns, please feel free to contact us.</p>
        <p style="margin: 20px 0;">Thank you for using Traveller Choice</p>
        <p style="margin: 20px 0;">Email :- ${companyDetails.email} </p>
        <p style="margin: 20px 0;">WhatsApp :-${companyDetails.phoneNumber1}</p>
        <p style="margin: 20px 0;">Customer Care :- ${
          companyDetails.phoneNumber2
        } </p>
      </body>
    
        <hr style="border:none; border-top:1px solid #eee" />
        <div style="float:left;padding:8px 0;color:#aaa;font-size:0.8em;line-height:1;font-weight:300">
         <img src=${REACT_APP_SERVER_URL + companyDetails.logo}/> 
        </div>
      </div>
    </div>
         `
    );
  } catch (err) {
    console.log(err);
  }
};

module.exports = sendWalletDeposit;
