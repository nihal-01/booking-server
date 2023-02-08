const { sendEmail } = require("../../helpers");

const sendVisaApplicationApproveEmail = (visaApplication ,filteredTraveller ) => {

  try {
    sendEmail(
        visaApplication.email,
      "Visa Application Cancellation Email",
       `<body style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.5;">
       <div style="background-color: #333; color: #fff; padding: 20px; text-align: center;">
         <h1 style="margin: 0;">Visa Application Cancelled</h1>
       </div>
       <div style="background-color: #f7f7f7; padding: 20px;">
         <p style="font-size: 18px; font-weight: bold;">Dear ${visaApplication.country.countryName},</p>
         <p style="margin-top: 20px;">Your Visa is Cancelled. Your visa  details are as follows:</p>
         <table style="width: 100%; margin-top: 20px; border-collapse: collapse;">
           <tr style="background-color: #eee;">
            
             <td style="padding: 10px; border: 1px solid #ddd;">Reference Number:</td>
             <td style="padding: 10px; border: 1px solid #ddd;">${visaApplication.referenceNo}</td>
           </tr>
           <tr >
             <td style="padding: 10px; border: 1px solid #ddd;">Travellers Name:</td>
             <td style="padding: 10px; border: 1px solid #ddd;">${filteredTraveller[0].firstName} ${filteredTraveller[0].lastName}</td>
           </tr>
           <tr style="background-color: #eee;">
            
             <td style="padding: 10px; border: 1px solid #ddd;">Passport No</td>
             <td style="padding: 10px; border: 1px solid #ddd;">${filteredTraveller[0]?.passportNo}</td>
           </tr>
           <tr >
           <td style="padding: 10px; border: 1px solid #ddd;">Contact No:</td>
           <td style="padding: 10px; border: 1px solid #ddd;">${filteredTraveller[0]?.contactNo}</td>
         </tr>
         <tr >
           <td style="padding: 10px; border: 1px solid #ddd;">Reason :</td>
           <td style="padding: 10px; border: 1px solid #ddd;">${filteredTraveller[0]?.reason}</td>
         </tr>
         
         </table>
         

         <p>If you have any questions or concerns regarding your order, please do not hesitate to contact us.</p>
         <p style="margin-top: 20px;">Thank you for choosing [Company Name]. We look forward to serving you.</p>
         <p>Best regards,<br><br>Admin<br>Travellers</p>
       </div>
     </body>
   `
      
    );
  } catch (err) {
    console.log(err);
  }
};

module.exports = sendVisaApplicationApproveEmail;