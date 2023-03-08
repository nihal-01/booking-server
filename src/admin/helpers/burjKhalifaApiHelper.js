const axios = require("axios");
const { ApiMaster } = require("../../models");
const { parseStringPromise } = require("xml2js");

module.exports = {
    AuthenticationRequest: async () => {
        try {
            const api = await ApiMaster.findOne({ apiCode: "ATBRJ01" });

            const url = api.demoUrl;

            const username = process.env.BURJ_KHALIFA_USERNAME;
            const password = process.env.BURJ_KHALIFA_PASSWORD;

            const credentials = username + ":" + password;
            const authHeader =
                "Basic " + Buffer.from(credentials).toString("base64");

            const headers = {
                "Content-Type": "text/xml; charset=utf-8",
                Authorization: authHeader,
            };

            const xmlData = `
            <Envelope xmlns="http://schemas.xmlsoap.org/soap/envelope/">
            <Body>
                <Authentication xmlns="https://tickets.atthetop.ae/agentservices/AgentBooking.asmx">
                <userName>${api.liveUsername}</userName>
                <password>${api.livePassword}</password>
                </Authentication>
            </Body>
        </Envelope>
              `;

            const response = await axios.post(url, xmlData, { headers });

            console.log(response.data, " response");
        } catch (err) {
            console.log(err.message, "message");
        }
    },

    cancelBooking: async () => {
        try {
            const api = await ApiMaster.findOne({ apiCode: "ATBRJ01" });

            const url = api.demoUrl;
            const xmlData = `
            <soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
                xmlns:xsd="http://www.w3.org/2001/XMLSchema" 
                xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
              <soap:Body>
                <CancelBooking xmlns="http://tickets.atthetop.ae/AgentWebApi">
                  <agentId>${api.liveAgentId}</agentId>
                  <userName>${api.liveUsername}</userName>
                  <password>${api.livePassword}</password>
                  <Orderid>1234</Orderid>
                </CancelBooking>
              </soap:Body>
            </soap:Envelope>
            `;

            const headers = {
                "Content-Type": "text/xml; charset=utf-8",
                "Content-Length": xmlData.length,
                SOAPAction:
                    "http://tickets.atthetop.ae/AgentWebApi/CancelBooking",
            };

            const response = await axios.post(url, xmlData, { headers });
            console.log(response.data);

            const json = await parseStringPromise(response.data, {
                explicitArray: false,
            });
            let soapBody = json["soap:Envelope"]["soap:Body"];

            console.log(soapBody);
        } catch (err) {}
    },

    confirmTicket: async () => {
        try {
            const api = await ApiMaster.findOne({ apiCode: "ATBRJ01" });

            const url = api.demoUrl;

            const headers = {
                "Content-Type": "text/xml; charset=utf-8",
                SOAPAction:
                    "http://tickets.atthetop.ae/AgentWebApi/ConfirmTicket",
            };
            const xmlData = `<?xml version="1.0" encoding="utf-8"?>
              <soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
                <soap:Body>
                  <ConfirmTicket xmlns="http://tickets.atthetop.ae/AgentWebApi">
                    <agentId>int</agentId>
                    <userName>string</userName>
                    <password>string</password>
                    <VoucherNum>string</VoucherNum>
                    <guestName>string</guestName>
                    <BookingId>string</BookingId>
                  </ConfirmTicket>
                </soap:Body>
              </soap:Envelope>`;

            const response = await axios.post(url, xmlData, { headers });

            const json = await parseStringPromise(response.data);
            const confirmTicketResult =
                json["soap:Envelope"]["soap:Body"][0][
                    "ConfirmTicketResponse"
                ][0]["ConfirmTicketResult"][0];
        } catch (err) {}
    },

    getAgentTickets: async (res) => {
        try {
            const api = await ApiMaster.findOne({ apiCode: "ATBRJ01" });

            console.log(api, "api");
            const url = api.demoUrl;

            const username = process.env.BURJ_KHALIFA_USERNAME;
            const password = process.env.BURJ_KHALIFA_PASSWORD;

            const credentials = username + ":" + password;
            const authHeader =
                "Basic " + Buffer.from(credentials).toString("base64");

            const agentId = parseInt(api.demoAgentId);

            const xmlData = `            
            <Envelope xmlns="http://schemas.xmlsoap.org/soap/envelope/">
            <Body>
           <GetAgentTickets xmlns="http://tickets.atthetop.ae/AgentWebApi">
            <agentId>${parseInt(api.liveAgentId)}</agentId>
            <username>${api.liveUsername}</username>
            <password>${api.livePassword}</password>
            </GetAgentTickets>
            </Body>
            </Envelope>`;

            const headers = {
                "Content-Type": "text/xml; charset=utf-8",
                Authorization: authHeader,
            };

            const response = await axios.post(url, xmlData, { headers });
            console.log(response.data);

            const json = await parseStringPromise(response.data);

            const agentTicket =
                json["soap:Envelope"]["soap:Body"][0][
                    "GetAgentTicketsResponse"
                ][0]["GetAgentTicketsResult"][0]["ResourceEventCollection"][0];

            console.log(agentTicket, "agentTicket");

            const objects = agentTicket.AgentServiceResourceEvents.map(
                (event) => {
                    return {
                        AttractionName: event.AttractionName[0],
                        TicketName: event.TicketName[0],
                        EventtypeId: event.EventtypeId[0],
                        ResourceID: event.ResourceID[0],
                        Description: event.Description[0],
                        IsCapacityEnabled: event.IsCapacityEnabled[0],
                    };
                }
            );

            console.log(objects, "objects");

            console.log(JSON.stringify(objects, null, 2));

            return objects;
        } catch (err) {
            console.log(err, "eror");
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
                  <agentId>int</agentId>
                  <userName>string</userName>
                  <password>string</password>
                  <selectedTimeSlot>
                    <EventID>int</EventID>
                    <EventName>string</EventName>
                    <StartDateTime>dateTime</StartDateTime>
                    <EndDateTime>dateTime</EndDateTime>
                    <EventTypeID>int</EventTypeID>
                    <ResourceID>int</ResourceID>
                    <Available>int</Available>
                    <Status>int</Status>
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
            const responseStatus =
                json["soap:Envelope"]["soap:Body"]["GetTicketTypesResponse"][
                    "GetTicketTypesResult"
                ]["ServiceResponse"];
        } catch (err) {}
    },

    getOrderDetails: async () => {
        try {
            const api = await ApiMaster.findOne({ apiCode: "ATBRJ01" });

            const url = api.demoUrl;
            const headers = {
                "Content-Type": "text/xml; charset=utf-8",
                SOAPAction:
                    "http://tickets.atthetop.ae/AgentWebApi/GetOrderDetails",
            };
            const xmlData = `
            <?xml version="1.0" encoding="utf-8"?>
            <soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
              <soap:Body>
                <GetOrderDetails xmlns="http://tickets.atthetop.ae/AgentWebApi">
                  <agentId>int</agentId>
                  <userName>string</userName>
                  <password>string</password>
                  <Orderid>int</Orderid>
                </GetOrderDetails>
              </soap:Body>
            </soap:Envelope>
          `;

            const response = await axios.post(url, xmlData, { headers });

            const json = await parseStringPromise(response.data);

            const getOrderDetailsResult =
                result["soap:Envelope"]["soap:Body"][0][
                    "GetOrderDetailsResponse"
                ][0]["GetOrderDetailsResult"][0];
        } catch (err) {}
    },

    getPublishedRates: async () => {
        try {
            const api = await ApiMaster.findOne({ apiCode: "ATBRJ01" });

            const url = api.demoUrl;
            const xmlData = `<?xml version="1.0" encoding="utf-8"?>
            <soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
            xmlns:xsd="http://www.w3.org/2001/XMLSchema"
            xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
              <soap:Body>
                <GetPublishedRates xmlns=""http://stagingatthetop.emaar.ae/NewAgentServices/AgentBooking.asmx"">
                <agentId>${agentId}</agentId>
                <username>${api.demoUsername}</username>
                <password>${api.demoPassword}</password>
                  <eventTypeId>int</eventTypeId>
                  <resourceId>int</resourceId>
                  <timeSlotDate>dateTime</timeSlotDate>
                </GetPublishedRates>
              </soap:Body>
            </soap:Envelope>`;

            const headers = {
                "Content-Type": "text/xml; charset=utf-8",
                "Content-Length": xmlData.length.toString(),
                SOAPAction:
                    "http://tickets.atthetop.ae/AgentWebApi/GetPublishedRates",
            };

            const response = await axios.post(url, xmlData, { headers });
        } catch (err) {}
    },

    getTimeSlotWithRates: async () => {
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
                <eventTypeId>int</eventTypeId>
                <resourceId>int</resourceId>
                <timeSlotDate>dateTime</timeSlotDate>
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

    getLeastPriceOfDay: async (apiData) => {
        try {
            const api = await ApiMaster.findOne({ apiCode: "ATBRJ01" });

            const username = process.env.BURJ_KHALIFA_USERNAME;
            const password = process.env.BURJ_KHALIFA_PASSWORD;

            const credentials = username + ":" + password;
            const authHeader =
                "Basic " + Buffer.from(credentials).toString("base64");

            const url = api.demoUrl;

            const xmlData = `<Envelope xmlns="http://schemas.xmlsoap.org/soap/envelope/">
            <Body>
                <GetPublishedRates xmlns="http://tickets.atthetop.ae/AgentWebApi">
                <agentId>${parseInt(api.liveAgentId)}</agentId>
                <username>${api.liveUsername}</username>
                <password>${api.livePassword}</password>
                <eventTypeId>${parseInt(apiData.EventtypeId)}</eventTypeId>
                <resourceId>${parseInt(apiData.ResourceID)}</resourceId>
               <timeSlotDate>${new Date().toISOString()}</timeSlotDate>
                </GetPublishedRates>
            </Body>
        </Envelope>`;

            const headers = {
                "Content-Type": "text/xml; charset=utf-8",
                Authorization: authHeader,
            };

            const response = await axios.post(url, xmlData, { headers });

            const json = await parseStringPromise(response.data);

            console.log(response.data);

            const agentTicket =
                json["soap:Envelope"]["soap:Body"][0][
                    "GetPublishedRatesResponse"
                ][0]["GetPublishedRatesResult"][0][
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

            console.log(objects, "objects");

            const leastAdultPrice = Math.min(
                ...objects.map((event) => parseFloat(event.AdultPrice))
            );
            const leastChildPrice = Math.min(
                ...objects.map((event) => parseFloat(event.ChildPrice))
            );

            console.log("Least Adult Price:", leastAdultPrice);
            console.log("Least Child Price:", leastChildPrice);

            // return leastAdultPrice, leastChildPrice;
        } catch (err) {
            console.log(err.message, "error");
        }
    },
};
