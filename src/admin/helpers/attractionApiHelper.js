const { sendErrorResponse } = require("../../helpers");
const { ApiMaster } = require("../../models");
const axios = require("axios");
const { dubaiParkAuhthentication } = require("./dubaiParkAuth");

module.exports = {
    attractionApi: async (res, apiId) => {
        try {
            const token = await dubaiParkAuhthentication(apiId);

            console.log(token , "auth");

            const headers = {
                Source: "TRAVELLERS_CHOICE",
                Channel: "Web Portal",
                "Web-Client": "postman",
                Authorization: "Bearer " + token,
            };

            const response = await axios.get(
                "https://am-uat.dubaiparksandresorts.com/wso2/sec/services/dpr/resellerProducts/1.0.0",
                {
                    headers: headers,
                }
            );

            return response.data.data.productList;
        } catch (err) {
            console.log(err.message, "message");
            return sendErrorResponse(res, 400, "api not found");
        }
    },
};
