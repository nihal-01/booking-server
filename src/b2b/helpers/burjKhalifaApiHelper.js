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

            const username = process.env.BURJ_KHALIFA_USERNAME;
            const password = process.env.BURJ_KHALIFA_PASSWORD;

            const credentials = username + ":" + password;
            const authHeader =
                "Basic " + Buffer.from(credentials).toString("base64");

            const url = api.liveUrl;

            const xmlData = `
        <Envelope xmlns="http://schemas.xmlsoap.org/soap/envelope/">
        <Body>
        <GetTimeSlotWithRates xmlns="http://tickets.atthetop.ae/AgentWebApi">
        <agentId>${parseInt(api.liveAgentId)}</agentId>
        <username>${api.liveUsername}</username>
        <password>${api.livePassword}</password>
        <eventTypeId>${parseInt(apiData.EventtypeId)}</eventTypeId>
        <resourceId>${parseInt(apiData.ResourceID)}</resourceId>
       <timeSlotDate>${new Date().toISOString()}</timeSlotDate>
        </GetTimeSlotWithRates>
       </Body>
        </Envelope>`;

            const headers = {
                "Content-Type": "text/xml; charset=utf-8",
                Authorization: authHeader,
            };

            const response = await axios.post(url, xmlData, { headers });

            const json = await parseStringPromise(response.data);

            const agentTicket =
                json["soap:Envelope"]["soap:Body"][0][
                    "GetTimeSlotWithRatesResponse"
                ][0]["GetTimeSlotWithRatesResult"][0][
                    "dataAgentServiceEventsCollection"
                ][0];

            const objects = agentTicket.AgentServiceEventsPrice.map((event) => {
                return {
                    EventID: event.EventID[0],
                    EventName: event.EventName[0],
                    StartDateTime: event.StartDateTime[0],
                    EndDateTime: event.EndDateTime[0],
                    EndDateTime: event.EndDateTime[0],
                    ResourceID: event.ResourceID[0],
                    Available: event.Available[0],
                    Status: event.Status[0],
                    AdultPrice: event.AdultPrice[0],
                    ChildPrice: event.ChildPrice[0],
                };
            });

            return {
                objects,
            };
        } catch (err) {
            console.log(err.message, "error");
        }
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
