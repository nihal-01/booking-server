const { sendEmail } = require("../../helpers");

const sendVisaApplicationApproveEmail = (
  visaApplication,
  reseller,
  filteredTraveller
) => {
  try {
    const visaUploadUrl =
      process.env.SERVER_URL + filteredTraveller[0]?.visaUpload;

    sendEmail(
      visaApplication.email,
      "Visa Application Approved Email",
      `<body style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.5;">
       <div style="background-color: #333; color: #fff; padding: 20px; text-align: center;">
         <h1 style="margin: 0;">Visa Application Confirmation</h1>
       </div>
       <div style="background-color: #f7f7f7; padding: 20px;">
         <p style="font-size: 18px; font-weight: bold;">Dear ${filteredTraveller[0].firstName},</p>
         <p style="margin-top: 20px;">Your Visa is Approved. Your visa  details are as follows:</p>
         <table style="width: 100%; margin-top: 20px; border-collapse: collapse;">
           <tr style="background-color: #eee;">
            
             <td style="padding: 10px; border: 1px solid #ddd;">Reference Number:</td>
             <td style="padding: 10px; border: 1px solid #ddd;">${visaApplication.referenceNumber}</td>
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
         <p style="margin-top: 20px;">Download your Visa file: <a href="${visaUploadUrl}" >here</a>.</p>
         
         </table>
         <p>If you have any questions or concerns regarding your order, please do not hesitate to contact us.</p>
         <p style="margin-top: 20px;">Thank you for choosing ${reseller.companyName}. We look forward to serving you.</p>
       
       </div>
     </body>
   `
    );
  } catch (err) {
    console.log(err);
  }
};

module.exports = sendVisaApplicationApproveEmail;
