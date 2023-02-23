const nodemailer = require("nodemailer");
const { sendEmail } = require("../../helpers");
const commonFooter = require("../../helpers/commonFooter");

const sendOrderConfirmationEmail = async (email,name, attractionOrder,bookingConfirmationNumber ,note) => {
  try {

    const footerHtml = await commonFooter();

    const totalPersons =
    attractionOrder.activities[0].adultsCount ||
      0 + attractionOrder.activities[0].infantCount ||
      0 + attractionOrder.activities[0].childrenCount;

    sendEmail(
      email,
      "Order Confirmation Mail",
      `<body style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.5;">
            <div style="background-color: #333; color: #fff; padding: 20px; text-align: center;">
              <h1 style="margin: 0;">Order Confirmation</h1>
            </div>
            <div style="background-color: #f7f7f7; padding: 20px;">
              <p style="font-size: 18px; font-weight: bold;">Dear ${
                 name
              },</p>
              <p style="margin-top: 20px;">Thank you for your order. Your order details are as follows:</p>
              <table style="width: 100%; margin-top: 20px; border-collapse: collapse;">
                <tr style="background-color: #eee;">
                 
                  <td style="padding: 10px; border: 1px solid #ddd;">Reference Number:</td>
                  <td style="padding: 10px; border: 1px solid #ddd;">${
                    attractionOrder.referenceNumber
                  }</td>
                </tr>
                <tr style="background-color:  "" : "#eee">

                      <td style="padding: 10px; border: 1px solid #ddd;">Total Visitors:</td>
                      <td style="padding: 10px; border: 1px solid #ddd;">${totalPersons}</td>
                    </tr>
                    <tr style="background-color: #eee;">
                    <td style="padding: 10px; border: 1px solid #ddd;">Order Type:</td>
                  <td style="padding: 10px; border: 1px solid #ddd;">${
                    attractionOrder.activities[0].bookingType
                  }</td>
                </tr>
                <tr style="background-color:  "" : "#eee">
                 
                  <td style="padding: 10px; border: 1px solid #ddd;">Attraction:</td>
                  <td style="padding: 10px; border: 1px solid #ddd;">${
                    attractionOrder.activities[0].attraction.title
                  }</td>
                </tr>
                <tr style="background-color: #eee;">
                 
                <td style="padding: 10px; border: 1px solid #ddd;">Booking Confirmation Number:</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${
                  bookingConfirmationNumber
                }</td>
              </tr>
              <tr style="background-color:  "" : "#eee">
                  <td style="padding: 10px; border: 1px solid #ddd;">Date:</td>
                  <td style="padding: 10px; border: 1px solid #ddd;">${new Date(
                    attractionOrder.activities[0].date
                  ).toLocaleString("default", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}</td>
                </tr>
                <tr style="background-color: #eee;">
                 
                <td style="padding: 10px; border: 1px solid #ddd;">Booking Confirmation Number:</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${
                  note
                }</td>
              </tr>
             
              </table>
              <p>If you have any questions or concerns regarding your order, please do not hesitate to contact us.</p>
              <p style="margin-top: 20px;">Thank you for choosing Travellers Choice. We look forward to serving you.</p>
              ${footerHtml}
              </div>
          </body>
        
         `
    );

    console.log("email has been sent");
  } catch (error) {
    console.log(error);
    console.log("E-mail not sent");
  }
};

module.exports = sendOrderConfirmationEmail;
