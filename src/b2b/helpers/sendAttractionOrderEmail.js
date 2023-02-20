const nodemailer = require("nodemailer");
const { sendEmail } = require("../../helpers");

const sendAttractionOrderEmail = async (reseller, attractionOrder) => {
  try {
    sendEmail(
      attractionOrder.email,
      "Order Placed Mail",
      `<body style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.5;">
            <div style="background-color: #333; color: #fff; padding: 20px; text-align: center;">
              <h1 style="margin: 0;">Order Placed</h1>
            </div>
            <div style="background-color: #f7f7f7; padding: 20px;">
              <p style="font-size: 18px; font-weight: bold;">Dear ${
                attractionOrder.name
              },</p>
              <p style="margin-top: 20px;">Thank you for your order. Your order details are as follows:</p>
              <table style="width: 100%; margin-top: 20px; border-collapse: collapse;">
                <tr style="background-color: #eee;">
                  <td style="padding: 10px; border: 1px solid #ddd;">Reference Number:</td>
                  <td style="padding: 10px; border: 1px solid #ddd;">${
                    attractionOrder.referenceNumber
                  }</td>
                </tr>
                <tr style="background-color: #eee;">
                  <td style="padding: 10px; border: 1px solid #ddd;">Total Amount:</td>
                  <td style="padding: 10px; border: 1px solid #ddd;">${
                    attractionOrder.totalAmount
                  } AED</td>
                </tr>
                <tr style="background-color: #eee;">
                  <td style="padding: 10px; border: 1px solid #ddd;">Total Attractions:</td>
                  <td style="padding: 10px; border: 1px solid #ddd;">${
                    attractionOrder.activities.length
                  }</td>
                </tr>
                </table>

                ${attractionOrder.activities
                  .map((activity, index) => {
                    const link =
                      activity?.bookingType === "ticket"
                        ? `<a href="${process.env.REACT_APP_URL}/ticket/attraction/${attractionOrder?._id}">View Ticket</a>`
                        : "";

                    const totalPersons =
                      activity.adultsCount ||
                      0 + activity.infantCount ||
                      0 + activity.childrenCount;

                    return `
                  <div>
                  <p style="padding: 10px; ">Attraction ${index + 1}</p>
                  <table style="width: 100%; margin-top: 20px; border-collapse: collapse;">

                  
                    <tr style="background-color: ${
                      index % 2 === 0 ? "#eee" : ""
                    };">
                    <td style="padding: 10px; border: 1px solid #ddd;">Attraction:</td>
                      <td style="padding: 10px; border: 1px solid #ddd;">${
                        activity.activity.attraction.title
                      }</td>
               
                    </tr>
                    <tr style="background-color: ${
                      index % 2 === 0 ? "" : "#eee"
                    };">
                    <td style="padding: 10px; border: 1px solid #ddd;">Order Type:</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">${
                      activity.bookingType
                    }</td>
                    </tr>
                    <tr style="background-color: ${
                      index % 2 === 0 ? "#eee" : ""
                    };">
                      <td style="padding: 10px; border: 1px solid #ddd;">Total Visitors:</td>
                      <td style="padding: 10px; border: 1px solid #ddd;">${totalPersons}</td>
                    </tr>
                          <tr style="background-color: ${
                            index % 2 === 0 ? "" : "#eee"
                          };">
                      <td style="padding: 10px; border: 1px solid #ddd;">Amount:</td>
                      <td style="padding: 10px; border: 1px solid #ddd;">${
                        activity.grandTotal
                      } AED</td>
                    </tr>
                    <tr style="background-color: ${
                      index % 2 === 0 ?  "#eee" : ""
                    };">
                    <td style="padding: 10px; border: 1px solid #ddd;">Booking Date:</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">${new Date(
                      activity?.date
                    ).toLocaleString("default", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}</td>
                    </tr>
                    <tr style="background-color: ${
                      index % 2 === 0 ? "" : "#eee"
                    };">
                    <td style="padding: 10px; border: 1px solid #ddd;">Download Ticket</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">${link}</td>
                    </tr>
                    
                    
                    </table>
                    </div>
                    

                   
                  `;
                  })
                  .join("")}
              <p>If you have any questions or concerns regarding your order, please do not hesitate to contact us.</p>
              <p style="margin-top: 20px;">Thank you for choosing ${
                reseller.companyName
              }. We look forward to serving you.</p>
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

module.exports = sendAttractionOrderEmail;
