const nodemailer = require("nodemailer");

const sendEmail = async ({
    senderEmail,
    senderPassword,
    subject,
    html,
    mailList,
}) => {
    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: senderEmail,
                pass: senderPassword,
            },
        });

        await transporter.sendMail({
            from: senderEmail,
            to: mailList,
            subject: `Travellers Choice - ${subject}`,
            html,
        });

        console.log("email has been sent");
    } catch (error) {
        console.log(error);
        console.log("E-mail not sent");
    }
};

module.exports = sendEmail;
