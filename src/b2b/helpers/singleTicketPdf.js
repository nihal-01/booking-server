const html_to_pdf = require("html-pdf-node");
const bwipjs = require("bwip-js");
const qrcode = require("qrcode");
const QRious = require("qrious");

const createSingleTicketPdf = async (activity, ticket) => {
    let combinedHtmlDoc = "";
    let options = {
        format: "A4",
        // type: "buffer",
        // generate buffer instead of file
    };

    const generateBarcodeImage = (content) => {
        return new Promise((resolve, reject) => {
            bwipjs.toBuffer(
                {
                    bcid: "code128", // Barcode type
                    text: content, // Barcode content
                    scale: 2, // Image scale factor
                    height: 10, // Barcode height in millimeters
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
    // const generateQRCodeImage = (content) => {
    //     const qr = new QRious({
    //         value: content,
    //         size: 250, // adjust the size as per your requirement
    //     });
    //     return qr.toDataURL();
    // };
    // const generateQRCodeImage = (content) => {
    //     return new Promise((resolve, reject) => {
    //         qrcode.toDataURL(content, (err, pngBuffer) => {
    //             if (err) {
    //                 reject(err);
    //             } else {
    //                 resolve(pngBuffer.toString("base64"));
    //             }
    //         });
    //     });
    // };

    console.log(activity, ticket, "activity");

    const generateQRCodeImage = async (content) => {
        try {
            const qrCodeDataUrl = await qrcode.toDataURL(content);
            return qrCodeDataUrl;
        } catch (error) {
            console.error(error);
            return null;
        }
    };

    let barcodeImage = await generateBarcodeImage(ticket.ticketNo);
    let qrCodeImage = await generateQRCodeImage(ticket.ticketNo);
    let styles = `
            <style>
            </style>`;
    let ticketHtmlDoc = `${styles}
    <div style="min-width: 100vw; min-height: 100vh; background-color: white;">
  <main style="width: 700px; margin: 0 auto;">
    <div style="width: 100%; background-color: primary; padding-top: 7px;" class="primary__section">
      <div style="display: grid; grid-template-columns: repeat(5, 1fr);" class="grid grid-cols-5 pt-7">
        <div style="grid-column: 1 / span 2;" class="col-span-2">
          <img style="width: 200px; height: 100px;" src="${
              process.env.SERVER_URL
          }${activity?.attraction?.logo}" alt="">
        </div>
        <div style="grid-column: 3 / span 3; display: flex; justify-content: flex-end;" class="col-span-3 flex justify-end">
          <img src="data:image/png;base64,${barcodeImage}" />

        </div>
      </div>
    </div>
    <div style="background-color: #e3f2fd; border: 2px solid #a3c4dc; border-radius: 20px; margin-top: 20px; display: grid; grid-template-columns: repeat(12, 1fr); align-items: center;">
      <div style="border-right: 2px dashed #a3c4dc; padding: 20px; grid-column: 1 / span 7;">
        <div style="border-bottom: 2px dashed #a3c4dc;">
          <h1 style="font-size: 14px; font-weight: 600; padding: 10px 0;">Tour Name : ${
              activity?.activity?.name
          }</h1>
        </div>
        <div style="grid-template-columns: repeat(2, 1fr); font-size: 10px; margin-top: 20px; display: grid;">
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap-x: 1px; gap-y: 2px;">
            <div style="">Ticket Type:</div>
            <div style="text-transform: capitalize;">${ticket?.ticketFor}</div>
            <div style="">Destination:</div>
            <div style="text-transform: capitalize;">${
                activity?.bookingType
            }</div>
          </div>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap-x: 1px; gap-y: 2px;">
            <div style="">Validity Till:</div>
            <div style="">${
                ticket && ticket.validity
                    ? new Date(ticket.validTill).toLocaleString("default", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                      })
                    : "N/A"
            }</div>
            <div style="">Number:</div>
            <div style="">${ticket?.lotNo}}</div>
          </div>
        </div>
      </div>
      <div style="padding: 80px 0; grid-column: 8 / span 5; position: relative;">
        <div style="height: 5px; width: 5px; background-color: #fff; border-radius: 50%; position: absolute; top: -15px; left: -20px;"></div>
        <div style="height: 5px; width: 5px; background-color: #fff; border-radius: 50%; position: absolute; bottom: -15px; left: -20px;"></div>
        <div style="width: 100%; height: 100%; display: flex; justify-content: center; align-items: center;">
          <div style="">
            <div style="display: flex; justify-content: center;">
              <div style="height: 100px; width: 100px;">
                <img src="${qrCodeImage}" />
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
    <div class="last__section">
      <div class="grid" style="grid-template-columns: repeat(3, 1fr); width: 100%; height: 200px; border-radius: 2xl; overflow: hidden; margin-top: 4px;">
        ${activity?.attraction?.images?.map((link) => {
            return `
        <div style="height: 300px;">
          <img src="${process.env.SERVER_URL}${link}" alt="images" className="h-[300px] w-[100%]" /> `;
        })}
        </div>
      </div>
    </div>
    <div style="margin-top:4px; font-size: 9px; text-align: center; ">
    <div
    
      id="ticket-description"
    ></div>
  </div>  
  </main>
</div>
              
        `;
    combinedHtmlDoc += ticketHtmlDoc;

    let file = {
        content: combinedHtmlDoc,
    };

    try {
        let pdfBuffer = await html_to_pdf.generatePdf(file, options);
        return pdfBuffer;
    } catch (err) {
        throw err;
    }
};

module.exports = createSingleTicketPdf;
