const axios = require("axios");

module.exports = {
    flightAvailabilitySearch: async (request) => {
        try {
            console.log(request, "request");
            const baseURL = process.env.FLIGHT_SERVER_URL;

            console.log(baseURL, "BASEURL");
            const endpointURL = "/api/v1/flights/search/availability";

            const requestBody = request;

            let response = await axios.post(
                baseURL + endpointURL,
                requestBody
                // {
                //     headers,
                // }
            );

            return response.data;
        } catch (err) {
            console.log(err, "error");
        }
    },

    getSingleTripDetails: async (request) => {
        try {
            const baseURL = process.env.FLIGHT_SERVER_URL;

            console.log(baseURL, "BASEURL");
            const endpointURL = "/api/v1/flights/details/all";

            const requestBody = request;

            let response = await axios.post(baseURL + endpointURL, requestBody);

            return response.data;
            
        } catch (err) {
            console.log(err, "error");
        }
    },
};
