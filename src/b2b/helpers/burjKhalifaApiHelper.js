const { ApiMaster } = require("../../models");
const axios = require("axios");

module.exports = {
    getTimeSlotWithRate: async (activity) => {
        try {
            const api = await ApiMaster.findOne({ apiCode: "ATBRJ01" });

            const url = api.demoUrl;
            const xmlData = `<?xml version="1.0" encoding="utf-8"?>
          <soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
            <soap:Body>
              <GetTimeSlotWithRates xmlns="http://tickets.atthetop.ae/AgentWebApi">
                <agentId>int</agentId>
                <username>string</username>
                <password>string</password>
                <eventTypeId>${activity.eventTypeId}</eventTypeId>
                <resourceId>${activity.resourceId}</resourceId>
                <timeSlotDate>${activity.timeSlotDate}</timeSlotDate>
              </GetTimeSlotWithRates>
            </soap:Body>
          </soap:Envelope>`;

            const headers = {
                "Content-Type": "text/xml; charset=utf-8",
                "Content-Length": xmlData.length.toString(),
                SOAPAction:
                    "http://tickets.atthetop.ae/AgentWebApi/GetTimeSlotWithRates",
            };

            const response = await axios.post(url, xmlData, { headers });

            const prices =
                result["soap:Envelope"]["soap:Body"][0][
                    "GetTimeSlotWithRatesResponse"
                ][0]["GetTimeSlotWithRatesResult"][0][
                    "dataAgentServiceEventsCollection"
                ][0]["AgentServiceEventsPrice"];

            const leastAdultPrice = Math.min(
                ...json["soap:Envelope"]["soap:Body"][0][
                    "GetTimeSlotWithRatesResponse"
                ][0]["GetTimeSlotWithRatesResult"][0][
                    "dataAgentServiceEventsCollection"
                ][0]["AgentServiceEventsPrice"].map((event) =>
                    parseFloat(event.AdultPrice[0])
                )
            );
            console.log("Least Adult Price:", leastAdultPrice);
        } catch (err) {}
    },

    getTimeSlot: async (eventTypeId, resourceId, timeSlotDate) => {
        try {
            const api = await ApiMaster.findOne({ apiCode: "ATBRJ01" });

            const url = api.demoUrl;
            const xmlData = `<?xml version="1.0" encoding="utf-8"?>
            <soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
              <soap:Body>
                <GetTimeSlot xmlns="http://tickets.atthetop.ae/AgentWebApi">
                  <agentId>int</agentId>
                  <username>string</username>
                  <password>string</password>
                  <eventTypeId>int</eventTypeId>
                  <resourceId>int</resourceId>
                  <timeSlotDate>dateTime</timeSlotDate>
                </GetTimeSlot>
              </soap:Body>`;

            const headers = {
                "Content-Type": "text/xml; charset=utf-8",
                "Content-Length": xmlData.length.toString(),
                SOAPAction:
                    "http://tickets.atthetop.ae/AgentWebApi/GetTimeSlot",
            };

            const response = await axios.post(url, xmlData, { headers });

            // const prices =
            //     result["soap:Envelope"]["soap:Body"][0][
            //         "GetTimeSlotWithRatesResponse"
            //     ][0]["GetTimeSlotWithRatesResult"][0][
            //         "dataAgentServiceEventsCollection"
            //     ][0]["AgentServiceEventsPrice"];

            console.log("Least Adult Price:", leastAdultPrice);
        } catch (err) {}
    },
    getAgentTickets: async (res) => {
        try {
            const api = await ApiMaster.findOne({ apiCode: "ATBRJ01" });

            const url = api.demoUrl;

            console.log(api, "api");

            const xmlData = `
            <?xml version="1.0" encoding="utf-8"?>
             <soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
                 <soap:Body>
                  <GetAgentTickets xmlns="http://tickets.atthetop.ae/AgentWebApi">
                  <agentId>${api.demoAgentId}</agentId>
                  <userName>${api.demoUsername}</userName>
                  <password>${api.demoPassword}</password>
                  </GetAgentTickets>
                </soap:Body>
              </soap:Envelope>`;

            const headers = {
                "Content-Type": "text/xml; charset=utf-8",
                SOAPAction:
                    "http://tickets.atthetop.ae/AgentWebApi/GetAgentTickets",
                // "Content-Type": "application/soap+xml; charset=utf-8",
                // "Content-Length": "length",
            };

            const response = await axios.post(url, xmlData, { headers });
            console.log(response.data);

            const json = await parseStringPromise(response.data);

            const agentTickets =
                json["soap:Envelope"]["soap:Body"]["GetAgentTicketsResponse"][
                    "GetAgentTicketsResult"
                ];

            return agentTickets;
        } catch (err) {
            console.log(err.message, "eror");
        }
    },

    getTicketType: async () => {
        try {
            const api = await ApiMaster.findOne({ apiCode: "ATBRJ01" });

            const url = api.demoUrl;

            const xmlData = `<?xml version="1.0" encoding="utf-8"?>
            <soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
            xmlns:xsd="http://www.w3.org/2001/XMLSchema"
            xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
              <soap:Body>
                <GetTicketTypes xmlns="http://tickets.atthetop.ae/AgentWebApi">
                <agentId>${api.demoAgentId}</agentId>
                <userName>${api.demoUsername}</userName>
                <password>${api.demoPassword}</password>
                  <selectedTimeSlot>
                    <EventID>${eventId}</EventID>
                    <EventName>${eventName}</EventName>
                    <StartDateTime>${startTime}</StartDateTime>
                    <EndDateTime>${endTime}</EndDateTime>
                    <EventTypeID>${eventTypeId}</EventTypeID>
                    <ResourceID>${resourceId}</ResourceID>
                    <Available>${available}</Available>
                    <Status>${status}</Status>
                  </selectedTimeSlot>
                </GetTicketTypes>
              </soap:Body>
            </soap:Envelope>`;

            const headers = {
                "Content-Type": "text/xml; charset=utf-8",
                SOAPAction:
                    "http://tickets.atthetop.ae/AgentWebApi/GetTicketTypes",
            };

            const response = await axios.post(url, xmlData, { headers });

            const json = await parseStringPromise(response.data);

            const ticketTypes =
                json["soap:Envelope"]["soap:Body"]["GetTicketTypesResponse"][
                    "GetTicketTypesResult"
                ]["TicketTypesCollection"]["AgentServiceTicketTypes"];
        } catch (err) {}
    },
};
