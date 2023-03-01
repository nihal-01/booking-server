const axios = require("axios");
const { ApiMaster } = require("../../models");

module.exports = {

    AuthenticationRequest: async () => {
        try {
            const api = await ApiMaster.findOne({ apiCode: "ATBRJ01" });

            const url = api.demoUrl;
            const headers = {
                "Content-Type": "text/xml; charset=utf-8",
                SOAPAction:
                    "http://tickets.atthetop.ae/AgentWebApi/Authentication",
                "Content-Length": "length",
            };

            const xmlData = `
                <?xml version="1.0" encoding="utf-8"?>
                <soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
                  <soap:Body>
                    <Authentication xmlns="http://tickets.atthetop.ae/AgentWebApi">
                      <userName>${api.demoUsername}</userName>
                      <password>${api.demoPassword}</password>
                    </Authentication>
                  </soap:Body>
                </soap:Envelope>
              `;

            const response = await axios.post(url, xmlData, { headers });
        } catch (err) {}
    },

    cancelBooking : async()=>{

        try{

            const api = await ApiMaster.findOne({ apiCode: "ATBRJ01" });

            const url = api.demoUrl;
            const xmlData = `
            <soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
                xmlns:xsd="http://www.w3.org/2001/XMLSchema" 
                xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
              <soap:Body>
                <CancelBooking xmlns="http://tickets.atthetop.ae/AgentWebApi">
                  <agentId>${api.demoAgentId}</agentId>
                  <userName>${api.demoUsername}</userName>
                  <password>${api.demoPassword}</password>
                  <Orderid>1234</Orderid>
                </CancelBooking>
              </soap:Body>
            </soap:Envelope>
            `;
            
            const headers = {
              'Content-Type': 'text/xml; charset=utf-8',
              'Content-Length': xmlData.length,
              SOAPAction: 'http://tickets.atthetop.ae/AgentWebApi/CancelBooking',
            };

            const response = await axios.post(url, xmlData, { headers });
            console.log(response.data);

        }catch(err){

        }
    },

    






};
