const { sendErrorResponse } = require("../helpers");
const { Attraction, Destination } = require("../models");



module.exports = {

   
    searchDestinationAndAtt :async(req,res)=>{

        try{
           
            let {search} = req.query
             

            let filters1 = { isDeleted : false}
            if (search && search !== "") {
                filters1.title = { $regex: search, $options: "i" };
            }

            let filters2 = { isDeleted : false}
            if (search && search !== "") {
                filters2.name = { $regex: search, $options: "i" };
            }
            
            let attractions = await Attraction.find(filters1)
            .select("title")
            .populate("destination", "name");

            let totoalAttraction = attractions.length
            
            let destinations =  await Destination.find(filters2).select("name")

            let totalDestination = destinations.length
             

            res.status(200).json({attractions ,totoalAttraction , destinations , totalDestination})
             

        }catch( err){
         
            sendErrorResponse(res, 500, err);


        }
    }
}