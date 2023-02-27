const { HomeSettings } = require("../models");

module.exports = async () => {
    const companyDetails = await HomeSettings.findOne();
    const imageUrl = process.env.SERVER_URL + companyDetails.logo;
    return `
    <p style="margin: 20px 0;">Best Regards</p>
   <p style="margin: 20px 0;">Travellers Choice</p>
    <p style="margin: 1px 0;">Email :- ${companyDetails.email} </p>
    <p style="margin: 1px 0;">WhatsApp :-${companyDetails.phoneNumber1}</p>
    <p style="margin: 1px 0;">Customer Care :- ${companyDetails.phoneNumber2} </p>
    <hr style="border:none; border-top:1px solid #eee" />
    <div style="float:left;padding:8px 0;color:#aaa;font-size:0.8em;line-height:1;font-weight:300">
     <img src="${imageUrl}"/> 
    </div>

    `;
};
