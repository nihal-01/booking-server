const { sendEmail } = require("../../helpers");


const sendWalletDeductMail = ( reseller ,order  ) => {
  try {
    
    sendEmail(
      reseller.email,
      "Wallet Amount Deduction Mail",
      `<div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2">
      <div style="margin:50px auto;width:70%;padding:20px 0">
        <div style="border-bottom:1px solid #eee">
          <a href="" style="font-size:1.4em;color: #00466a;text-decoration:none;font-weight:600">Travellers Choice</a>
        </div>
        <p style="font-size:1.1em">Hi,</p>
          <body style="font-family: Arial, sans-serif;">
        <h2 style="text-align: center;">Dear ${reseller.name},</h2>
        <p style="margin: 20px 0;">This is an automated notification to inform you that an amount of ${order?.totalAmount} has been debited from your wallet on ${order?.createdAt}. This debit was made for the following transaction: ${order?.referenceNumber}.</p>
        <p style="margin: 20px 0;">Please log in to your account to view the details of this transaction and your updated wallet balance. If you have any questions or concerns, please feel free to contact us.</p>
        <p style="margin: 20px 0;">Thank you for using Traveller Choice</p>
        <p style="margin: 20px 0;">Email :- travellerchoice@gmail.com </p>
        <p style="margin: 20px 0;">WhatsApp :-[WhatsApp Number]</p>
        <p style="margin: 20px 0;">Customer Care :- [Mobile Number]</p>
      </body>
    
        <hr style="border:none;border-top:1px solid #eee" />
        <div style="float:right;padding:8px 0;color:#aaa;font-size:0.8em;line-height:1;font-weight:300">
          <p>Your Brand Inc</p>
          <p>1600 Amphitheatre Parkway</p>
          <p>California</p>
        </div>
      </div>
    </div>
         `
    );
  } catch (err) {
    console.log(err);
  }
};

module.exports = sendWalletDeductMail;





