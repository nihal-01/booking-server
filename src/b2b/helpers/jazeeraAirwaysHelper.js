const axios = require("axios");

module.exports = {
    flightAvailabiltie: async () => {
        try {
            const url = "https://rtestapi.jazeeraairways.com/api/jz/v1/Token";
            const data = {
                credentials: {
                    userName: "TRVLCHOAPI",
                    password: "J9-travellers22",
                    domain: "WW2",
                    channelType: "API",
                },
                applicationName: "OTA",
            };
            const config = {
                headers: {
                    "Content-Type": "application/json",
                },
            };

            let response = await axios.post(url, data, config);

            console.log(response.data);
        } catch (err) {
            console.log(err);
        }
    },
};
