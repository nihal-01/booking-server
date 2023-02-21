const nodemailer = require("nodemailer");
const { sendEmail } = require("../../helpers");
const commonFooter = require("../../helpers/commonFooter");


const sendApplicationEmail = async (email ,visaApplication) => {
    
    try {
           
         const footerHtml =await  commonFooter();
 
          sendEmail(
            email,
             "Order Placed Mail",
            `<body style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.5;">
            <div style="background-color: #333; color: #fff; padding: 20px; text-align: center;">
              <h1 style="margin: 0;">Order Placed</h1>
            </div>
            <div style="background-color: #f7f7f7; padding: 20px;">
              <p style="font-size: 18px; font-weight: bold;">Dear Customer,</p>
              <p style="margin-top: 20px;">Thank you for your Visa Application. Your application details are as follows:</p>
              <table style="width: 100%; margin-top: 20px; border-collapse: collapse;">
                <tr style="background-color: #eee;">
                  <td style="padding: 10px; border: 1px solid #ddd;">Reference Number:</td>
                  <td style="padding: 10px; border: 1px solid #ddd;">${visaApplication.referenceNumber}</td>
                </tr>
                <tr style="background-color: "" : "#eee">
                <td style="padding: 10px; border: 1px solid #ddd;">Destination Country:</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${visaApplication.visaType.visa.country.countryName}</td>
              </tr>
                <tr style="background-color: #eee;">
                  <td style="padding: 10px; border: 1px solid #ddd;">Amount:</td>
                  <td style="padding: 10px; border: 1px solid #ddd;">${visaApplication.totalAmount}AED</td>
                </tr>
                <tr style="background-color:  "" : "#eee">
                  <td style="padding: 10px; border: 1px solid #ddd;">Onward Date:</td>
                  <td style="padding: 10px; border: 1px solid #ddd;">${new Date(visaApplication.onwardDate).toLocaleString('default', {month: 'short', day: 'numeric', year: 'numeric'})}</td>
                </tr>
                <tr style="background-color: #eee;">
                <td style="padding: 10px; border: 1px solid #ddd;">Return Date:</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${new Date(visaApplication.returnDate).toLocaleString('default', {month: 'short', day: 'numeric', year: 'numeric'})}</td>
              </tr>
                
                ${visaApplication.travellers.map((travellers, index) => {
                  return `
                  
                  <tr style="background-color: ${index % 2 === 0 ?  "" : "#eee"};">
                    <td style="padding: 10px; border: 1px solid #ddd;"> Traveller ${index + 1}</td>
                    </tr>
                    <tr style="background-color: ${index % 2 === 0 ? "#eee" : ""};">
                    <td style="padding: 10px; border: 1px solid #ddd;"> Name:</td>
                      <td style="padding: 10px; border: 1px solid #ddd;">${travellers.firstName} ${travellers.lastName}</td>
               
                    </tr>
                    <tr style="background-color: ${index % 2 === 0 ? "" : "#eee"};">
                    <td style="padding: 10px; border: 1px solid #ddd;">Passport Number:</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">${travellers.passportNo} </td>
                </tr>
                                         
                  `;
                }).join("")}
              </table>
              <p>If you have any questions or concerns regarding your order, please do not hesitate to contact us.</p>
              <p style="margin-top: 20px;">Thank you for choosing Travellers Choice . We look forward to serving you.</p>
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

module.exports = sendApplicationEmail;