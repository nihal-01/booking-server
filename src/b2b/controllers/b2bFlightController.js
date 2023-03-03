const { availabilitySearchSchema } = require("../../validations/flightApi.schema");


module.exports = {

    flightAvailabilitySearch : async(req,res)=>{

        try{
            const {
                from,
                to,
                departureDate,
                returnDate,
                noOfAdults,
                noOfChildren,
                noOfInfants,
                type,
                airItineraries,
            } = req.body;

            const { _, error } = availabilitySearchSchema.validate(req.body);
            if (error) {
                return sendErrorResponse(res, 400, error.details[0].message);
            }
            

            const data = await flightAvailabilitySearch()
        }catch(err){


        }
    }
}