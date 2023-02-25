const nodemailer = require("nodemailer");
const sendAdminEmail = require("../../helpers/sendAdminEmail");

const sendAttractionOrderAdminEmail = async (attractionOrder) => {
    try {
        sendAdminEmail(
            "New Order Placed Mail",
            `<body style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.5;">
            <div style="background-color: #333; color: #fff; padding: 20px; text-align: center;">
              <h1 style="margin: 0;">Order Confirmation</h1>
            </div>
            <div style="background-color: #f7f7f7; padding: 20px;">
              <p style="font-size: 18px; font-weight: bold;">Dear ${
                  attractionOrder.name
              },</p>
              <p style="margin-top: 20px;">Congrats for new order. New Order  order details are as follows:</p>
              <table style="width: 100%; margin-top: 20px; border-collapse: collapse;">
                <tr style="background-color: #eee;">
                  <td style="padding: 10px; border: 1px solid #ddd;">Reference Number:</td>
                  <td style="padding: 10px; border: 1px solid #ddd;">${
                      attractionOrder.referenceNumber
                  }</td>
                </tr>
                ${attractionOrder.activities
                    .map((activity, index) => {
                        return `
                    <tr style="background-color: ${
                        index % 2 === 0 ? "#eee" : ""
                    };">
                    <td style="padding: 10px; border: 1px solid #ddd;">Attraction:</td>
                      <td style="padding: 10px; border: 1px solid #ddd;">${
                          activity.activity?.attraction.title
                      }</td>
               
                    </tr>
                    <tr style="background-color: ${
                        index % 2 === 0 ? "" : "#eee"
                    };">
                    <td style="padding: 10px; border: 1px solid #ddd;">Order Type:</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">${
                        activity?.bookingType
                    }</td>
                    </tr>
                    
                          <tr style="background-color: ${
                              index % 2 === 0 ? "#eee" : ""
                          };">
                      <td style="padding: 10px; border: 1px solid #ddd;">Total Amount:</td>
                      <td style="padding: 10px; border: 1px solid #ddd;">${
                          activity?.amount
                      }</td>
                    </tr>
                    <tr style="background-color: ${
                        index % 2 === 0 ? "" : "#eee"
                    };">
                    <td style="padding: 10px; border: 1px solid #ddd;">Booking Date:</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">
                      ${new Date(activity?.date).toLocaleString("default", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                      })}
                    </td>
                  
                    </tr>
                   
                  `;
                    })
                    .join("")}
              </table>
              
              <p>If you have any questions or concerns regarding your order, please do not hesitate to contact us.</p>
              <p style="margin-top: 20px;">Thank you for choosing . We look forward to serving you.</p>
              <p>Admin</p>
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

module.exports = sendAttractionOrderAdminEmail;
