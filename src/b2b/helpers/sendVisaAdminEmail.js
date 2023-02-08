const nodemailer = require("nodemailer");
const { sendEmail } = require("../../helpers");
const sendAdminEmail = require("../../helpers/sendAdminEmail");

const sendAdminVisaApplicationEmail = async (visaApplication) => {
    
    try {
      
          sendAdminEmail(
            visaApplication.email,
             "New Order Placed Mail",
             `<body style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.5;">
            <div style="background-color: #333; color: #fff; padding: 20px; text-align: center;">
              <h1 style="margin: 0;">Order Confirmation</h1>
            </div>
            <div style="background-color: #f7f7f7; padding: 20px;">
              <p style="font-size: 18px; font-weight: bold;">DearAdmin,</p>
              <p style="margin-top: 20px;">New Order Placed. The order details are as follows:</p>
              <table style="width: 100%; margin-top: 20px; border-collapse: collapse;">
                <tr style="background-color: #eee;">
                  <td style="padding: 10px; border: 1px solid #ddd;">Reference Number:</td>
                  <td style="padding: 10px; border: 1px solid #ddd;">${attractionOrder.referenceNumber}</td>
                </tr>
                <tr style="background-color: #eee;">
                  <td style="padding: 10px; border: 1px solid #ddd;">Total Amount:</td>
                  <td style="padding: 10px; border: 1px solid #ddd;">${attractionOrder.totalAmount}</td>
                </tr>
                <tr style="background-color: #eee;">
                  <td style="padding: 10px; border: 1px solid #ddd;">Total Attractions:</td>
                  <td style="padding: 10px; border: 1px solid #ddd;">${attractionOrder.activities.length}</td>
                </tr>
                </table>

                ${attractionOrder.activities.map((activity, index) => {
                  return `
                  <div>
                  <p style="padding: 10px; ">Attraction ${index}</p>
                  <table style="width: 100%; margin-top: 20px; border-collapse: collapse;">

                  
                    <tr style="background-color: ${index % 2 === 0 ? "#eee" : ""};">
                    <td style="padding: 10px; border: 1px solid #ddd;">Attraction:</td>
                      <td style="padding: 10px; border: 1px solid #ddd;">${activity.activity.attraction.title}</td>
               
                    </tr>
                    <tr style="background-color: ${index % 2 === 0 ? "" : "#eee"};">
                    <td style="padding: 10px; border: 1px solid #ddd;">Order Type:</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">${activity.bookingType}</td>
                    </tr>
                    <tr style="background-color: ${index % 2 === 0 ? "#eee" : ""};">
                      <td style="padding: 10px; border: 1px solid #ddd;">Total Visitors:</td>
                      <td style="padding: 10px; border: 1px solid #ddd;">${activity.activity.adultCount}+${activity.activity.infantCount}+${activity.activity.adultCount}</td>
                    </tr>
                          <tr style="background-color: ${index % 2 === 0 ? "#eee" : ""};">
                      <td style="padding: 10px; border: 1px solid #ddd;">Total Amount:</td>
                      <td style="padding: 10px; border: 1px solid #ddd;">${activity.activity.amount}</td>
                    </tr>
                    <tr style="background-color: ${index % 2 === 0 ? "" : "#eee"};">
                    <td style="padding: 10px; border: 1px solid #ddd;">Booking Date:</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">${activity?.date}</td>
                    </tr>
                    </table>
                    </div>
                    

                   
                  `;
                }).join("")}
              <p style="margin-top: 20px;">Attached to this email, you will find a PDF of your booking/ticket and invoice. Please keep these documents for your records.</p>
              <p>If you have any questions or concerns regarding your order, please do not hesitate to contact us.</p>
              <p style="margin-top: 20px;">Thank you for choosing [Company Name]. We look forward to serving you.</p>
              <p>Best regards,<br><br>Admin<br>Travellers</p>
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

module.exports = sendAdminVisaApplicationEmail;