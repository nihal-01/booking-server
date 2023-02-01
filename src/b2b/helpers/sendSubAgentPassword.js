const { sendEmail } = require("../../helpers");

const sendSubAgentPassword = ({ email, password , agentCode }) => {
    try {
        sendEmail(
            email,
            "SubAgent registration details",
            `Your travellers choice Reseller registration details given below. dont't share this to anyone.
    
Email - ${email}
password - ${password}
AgentCode - ${agentCode}
    
Please update your password after login.
            `
        );
    } catch (err) {
        console.log(err);
    }
};

module.exports = sendSubAgentPassword;
