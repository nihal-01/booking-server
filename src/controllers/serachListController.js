const { Attraction } = require("../models");



module.exports = {

   
    searchDestinationAndAtt :async(req,res)=>{

        try{
           

            let {search} = req.query
             

            let filters1 = {}
            if (search && search !== "") {
                filters1.title = { $regex: search, $options: "i" };
            }

            let filters2 = {}
            if (search && search !== "") {
                filters2.name = { $regex: search, $options: "i" };
            }

            let attractions = await Attraction.find(filters1)
            .select("title")
            .populate("destination", "name");
            
            let destinations =  await Attraction.find(filters2).select("name")
             
            

            res.status(200).json({attractions , destinations})
             

        }catch( err){


        }
    }
}