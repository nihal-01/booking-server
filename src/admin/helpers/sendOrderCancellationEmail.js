const nodemailer = require("nodemailer");
const { sendEmail } = require("../../helpers");
const commonFooter = require("../../helpers/commonFooter");

const sendOrderCancellationEmail = async (
    email,
    name,
    attractionOrder
    // orderDetails
) => {
    try {
        const footerHtml = await commonFooter();

        // const totalPersons =
        //     orderDetails.activities[0].adultsCount ||
        //     0 + orderDetails.activities[0].infantCount ||
        //     0 + orderDetails.activities[0].childrenCount;

        sendEmail(
            email,
            "Order Cancellation Mail",
            `<body style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.5;">
            <div style="background-color: #333; color: #fff; padding: 20px; text-align: center;">
              <h1 style="margin: 0;">Order Cancellation</h1>
            </div>
            <div style="background-color: #f7f7f7; padding: 20px;">
              <p style="font-size: 18px; font-weight: bold;">Dear ${name},</p>
              <p style="margin-top: 20px;">We regret to inform you that your order reference number  ${
                  attractionOrder.referenceNumber
              }  attraction ${attractionOrder.activities[0].attraction.title}
              has been cancelled by our team on  ${new Date(
                  attractionOrder.activities[0].date
              ).toLocaleString("default", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
              })}.</p>
              <p  style="margin-top: 20px;>We understand that this may cause you inconvenience and we apologize for any inconvenience caused. We assure you that we take these matters seriously and our team is working to ensure that such incidents do not happen again in the future</p>
              <p  style="margin-top: 20px;>As the order has been cancelled, there will be no charges to your account, and any funds previously authorized for this order will be released. </p>
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

module.exports = sendOrderCancellationEmail;
