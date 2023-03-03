const { sendErrorResponse } = require("../../helpers");
const { ApiMaster } = require("../../models");
const axios = require("axios");

module.exports = {
    dubaiParkAuhthentication: async (apiId) => {
        try {
            const api = await ApiMaster.findById(apiId);

            if (!api) {
                return sendErrorResponse(res, 400, "api not found");
            }

            console.log(api, "api");

            const headers = {
                Authorization:
                    "Basic " +
                    Buffer.from(
                        api.demoUsername + ":" + api.demoPassword
                    ).toString("base64"),
                "Content-Type": "application/x-www-form-urlencoded",
            };

            const data = new URLSearchParams({
                grant_type: "client_credentials",
            });

            let auth = await axios.post(api.demoUrl, data, {
                headers: headers,
            });


            return auth.data.access_token;
        } catch (err) {
            console.log(err, "errr");
        }
    },


   
};
