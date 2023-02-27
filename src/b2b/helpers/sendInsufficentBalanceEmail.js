const { sendEmail } = require("../../helpers");

const sendInsufficentBalanceMail = (reseller, companyDetails) => {
    try {
        const footerHtml = commonFooter();

        sendEmail(
            reseller.email,
            "Wallet Recharge Mail",
            `<div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2">
      <div style="margin:50px auto;width:70%;padding:20px 0">
        <div style="border-bottom:1px solid #eee">
          <a href="" style="font-size:1.4em;color: #00466a;text-decoration:none;font-weight:600">Travellers Choice</a>
        </div>
        <p style="font-size:1.1em">Hi,</p>
        <p>Dear ${reseller.name},</p>
        <p>This is an automated notification to inform you that your wallet balance has reached less that you cannot complete this order. </p>
        <p>We strongly recommend that you add funds to your wallet as soon as possible to avoid any inconvenience. You can easily add funds by using a credit or debit card, or by using other payment methods available on our platform.</p>
        <p>If you have any questions or concerns, please feel free to contact us. Our team is always available to assist you.</p>
        <p>Thank you for choosing us. We hope to continue serving you in the future.</p>
                ${footerHtml}

    
        <hr style="border:none;border-top:1px solid #eee" />
        <div style="float:left;padding:8px 0;color:#aaa;font-size:0.8em;line-height:1;font-weight:300">

        </div>
      </div>
    </div>
         `
        );
    } catch (err) {
        console.log(err);
    }
};

module.exports = sendInsufficentBalanceMail;
