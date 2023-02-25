// const html_to_pdf = require("html-pdf-node");

const createQuotationPdf = async (ticketData) => {
    console.log(ticketData);
    let options = {
        format: "A4",
        path: "." + `/public/pdf/${ticketData.ticketNo}.pdf`,
    };
    let styles = `
    <style>
    </style>`;

    let htmlDoc = `${styles}
    <body>
    <h1>hiii</h1>
    </body>`;

    let file = {
        content: htmlDoc,
    };

    try {
        let pdfBuffer = await html_to_pdf.generatePdf(file, options);
    } catch (err) {
        throw err;
    }
};

module.exports = createQuotationPdf;
