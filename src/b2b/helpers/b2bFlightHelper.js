const axios = require("axios");

module.exports = {
    flightAvailabilitySearch: async (request) => {
        try {
            console.log(request, "request");
            const baseURL = process.env.FLIGHT_SERVER_URL;

            console.log(baseURL, "BASEURL");
            const endpointURL = "/api/v1/flights/search/availability";

            const requestBody = request;

            // const headers = {
            //     "Content-Type": "application/json",
            //     // Add any other headers here
            // };

            // Make the POST request
            let response = await axios.post(
                baseURL + endpointURL,
                requestBody
                // {
                //     headers,
                // }
            );
            console.log(response, "availabilty");

            return response.data;
        } catch (err) {
            console.log(err, "error");
        }
    },
};
