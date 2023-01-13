const sendEmail = require("./sendEmail");

const sendAdminPassword = ({ email, password }) => {
    try {
        sendEmail(
            email,
            "Admin registration details",
            `Your travellers choice admin registration details given below. dont't share this to anyone.
    
Email - ${email}
password - ${password}
    
Please update your password after login.
            `
        );
    } catch (err) {
        console.log(err);
    }
};

module.exports = sendAdminPassword;
