const bwipjs = require("bwip-js");
const qrcode = require("qrcode");
const QRious = require("qrious");
const puppeteer = require("puppeteer");

const createMultipleTicketPdf = async (ticketData) => {
    let combinedHtmlDoc = "";
    let options = {
        format: "A4",
        type: "buffer",
    };

    console.log(ticketData, "call reached");

    async function generatePdfAsBuffer(htmlContent, options) {
        // const browser = await puppeteer.launch();
        let browser = await puppeteer.launch({
            executablePath: "/usr/bin/chromium-browser",
            args: [
                "--disable-gpu",
                "--disable-setuid-sandbox",
                "--no-sandbox",
                "--no-zygote",
            ],
        });
        const page = await browser.newPage();
        await page.setContent(htmlContent);
        const pdfBuffer = await page.pdf(options);
        await browser.close();
        return pdfBuffer;
    }

    console.log(ticketData, "call reached");
    let tickets = [];
    if (ticketData?.adultTickets)
        tickets = [...tickets, ...ticketData?.adultTickets];
    if (ticketData?.childTickets)
        tickets = [...tickets, ...ticketData?.childTickets];
    tickets = tickets?.map((tkt) => {
        return {
            ...tkt,
            attraction: ticketData?.attraction,
            activity: ticketData?.activity,
        };
    });

    const generateBarcodeImage = (content) => {
        return new Promise((resolve, reject) => {
            bwipjs.toBuffer(
                {
                    bcid: "code128", // Barcode type
                    text: content, // Barcode content
                    scale: 1, // Image scale factor
                    height: 3, // Barcode height in millimeters
                },
                function (err, pngBuffer) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(pngBuffer.toString("base64"));
                    }
                }
            );
        });
    };

    const generateQRCodeImage = async (content) => {
        try {
            const qrCodeDataUrl = await qrcode.toDataURL(content);
            return qrCodeDataUrl;
        } catch (error) {
            console.error(error);
            return null;
        }
    };

    console.log(tickets);

    for (let i = 0; i < tickets.length; i++) {
        let ticket = tickets[i];

        let barcodeImage = await generateBarcodeImage(ticket.ticketNo);
        let qrCodeImage = await generateQRCodeImage(ticket.ticketNo);

        let styles = `
            <style>
            .last__section {
              margin-top: 4px;
          }
          
          .grid {
              display: grid;
           
          }
          
          .image-wrapper {
              position: relative;
              width: 100%;
              padding-bottom: 100%;
              overflow: hidden;
          }
            </style>`;
        let ticketHtmlDoc = `
        ${styles}
       
        <div style="min-width: 100vw; min-height: 100vh; background-color: white;">
        <main style="width: 700px; margin: 0 auto;">
          <div style="width: 100%; background-color: primary; padding-top: 7px;" class="primary__section">
             <div style="display: grid; grid-template-columns: repeat(5, 1fr);" class="grid grid-cols-5 pt-7">
               <div style="grid-column: 1 / span 2;" class="col-span-2">
                 <img style="width: 200px; height: 100px;" src="${
                     process.env.SERVER_URL
                 }${ticketData?.attraction?.logo}" alt="">
               </div>
               <div style="grid-column: 3 / span 3; display: flex; justify-content: flex-end; align-items: center;" class="col-span-3 flex justify-end ">
               <img style="height : 70px; width :200px;" src="data:image/png;base64,${barcodeImage}" />
     
             </div>
             </div>
           </div>
           <div style="background-color: #e3f2fd; border: 2px solid #a3c4dc; border-radius: 20px; margin-top: 20px; display: grid; grid-template-columns: repeat(12, 1fr); align-items: center;">
             <div style="border-right: 2px dashed #a3c4dc; padding: 10px 20px; grid-column: 1 / span 7;">
               <div style="border-bottom: 2px dashed #a3c4dc;">
                 <h1 style="font-size: 18px; font-weight: 600; padding: 10px 0;">Tour Name : ${
                     ticketData?.activity?.name
                 }</h1>
               </div>
               <div style="grid-template-columns: repeat(2, 1fr); font-size: 10px; margin-top: 10px; display: grid;">
                 <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap-x: 1px; gap-y: 2px;">
                   <div style="">Ticket Type:</div>
                   <div style="text-transform: capitalize;">${
                       ticket?.ticketFor
                   }</div>
                   <div style="">Destination:</div>
                   <div style="text-transform: capitalize;">${
                       ticketData?.destination?.name
                   }</div>
                 </div>
                 <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap-x: 1px; gap-y: 2px;">
                   <div style="">Validity Till:</div>
                   <div style="">  ${
                       ticket && ticket.validity
                           ? new Date(ticket.validTill).toLocaleString(
                                 "default",
                                 {
                                     month: "short",
                                     day: "numeric",
                                     year: "numeric",
                                 }
                             )
                           : "N/A"
                   }</div>
                   <div style="">Number:</div>
                   <div style="">${ticket?.lotNo}</div>
                 </div>
               </div>
             </div>
             <div style="padding: 30px 0; grid-column: 8 / span 5; position: relative;">
             <div style="height: 5px; width: 5px; background-color: #fff; border-radius: 50%; position: absolute; top: -15px; left: -20px;"></div>
             <div style="height: 5px; width: 5px; background-color: #fff; border-radius: 50%; position: absolute; bottom: -15px; left: -20px;"></div>
             <div style="width: 100%; height: 100%; display: flex; justify-content: center; align-items: center;">
          <div style="">
            <div style="display: flex; justify-content: center;">
              <div style="height: 100px; width: 100px;">
                <img src="${qrCodeImage}"  style="height: 100px; width: 100px;"/>
              </div>
            </div>
            <p style="font-size: 9px; text-align: center; margin-top: 2px;">${
                ticket?.ticketNo
            }</p>
            <p style="font-size: 9px; text-align: center;">Place Image against the scanner</p>
          </div>
        </div>
           </div>
           </div>
           <div class="last__section" style="height: 150px; width: 100%;">
           <div class="grid" style="grid-template-columns: repeat(3, 1fr); width: 100%; height: 150px; border-radius: 2xl; overflow: hidden; margin-top: 4px;">
             ${activity?.attraction?.images
                 ?.map((link, index) => {
                     const firstImage =
                         index === 0
                             ? "border-top-left-radius: 2xl; border-bottom-left-radius: 2xl;"
                             : "";
                     const lastImage =
                         index === activity.attraction.images.length - 1
                             ? "border-top-right-radius: 2xl; border-bottom-right-radius: 2xl;"
                             : "";
                     return `
                   <div class="image-wrapper" style="${firstImage}${lastImage}">
                     <img src="${process.env.SERVER_URL}${link}" alt="images" style="position: relative; width: 100%; padding-bottom: 100%; overflow: hidden; height:150px;" />
                   </div>
                 `;
                 })
                 .join("")}
           </div>
         </div>
         
         <div class="desc__section" style="padding-top: 10px; line-height: 16px; font-size: 12px;">
           <div id="ticket-description">
             ${ticketData.activity.description}
           </div>
         </div>
            
         </main>
       </div>

  
        `;
        combinedHtmlDoc += ticketHtmlDoc;
    }

    let file = {
        content: combinedHtmlDoc,
    };

    try {
        const pdfBuffer = await generatePdfAsBuffer(combinedHtmlDoc, options);
        // let pdfBuffer = await html_to_pdf.generatePdf(file, options);
        return pdfBuffer;
    } catch (err) {
        throw err;
    }
};

module.exports = createMultipleTicketPdf;
