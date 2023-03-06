const html_to_pdf = require("html-pdf-node");
const bwipjs = require("bwip-js");

const createMultipleTicketPdf = async (ticketData) => {
    let combinedHtmlDoc = "";
    let options = {
        format: "A4",
        path: "./public/pdf/tickets.pdf",
    };

    console.log(ticketData, "call reached");
    // const data = ticketData?.activites?.map((ele) => {
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
            // destination: ticketData?.destination,
        };
    });
    // return tickets;
    // });

    for (let i = 0; i < tickets.length; i++) {
        let ticket = tickets[i];
        let ticketHtmlDoc = `
          <body>
            <p>Details: ${ticket.ticketNo}</p>
            <div>
              <img src="data:image/png;base64,${await generateBarcodeImage(
                  ticket.ticketNo
              )}"/>
            </div>
          </body>
        `;
        combinedHtmlDoc += ticketHtmlDoc;
    }

    const generateBarcodeImage = (content) => {
        return new Promise((resolve, reject) => {
            bwipjs.toBuffer(
                {
                    bcid: "code128", // Barcode type
                    text: content, // Barcode content
                    scale: 3, // Image scale factor
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

    try {
        let pdfBuffer = await html_to_pdf.generatePdf(file, options);
    } catch (err) {
        throw err;
    }
};

module.exports = createMultipleTicketPdf;
