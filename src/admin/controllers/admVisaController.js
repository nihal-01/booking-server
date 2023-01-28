const { isValidObjectId } = require("mongoose");

const { sendErrorResponse } = require("../../helpers");
const { Country, VisaType, Visa } = require("../../models");
const { visaSchema, visaTypeSchema } = require("../validations/visa.schema");

module.exports = {
    createNewVisa: async (req, res) => {
        try {
            const {
                country,
                name,
                documents,
                inclusions,
                description,
                faqs,
                details,
                keywords,
            } = req.body;
            
            
            const { _, error } = visaSchema.validate(req.body);
            if (error) {
                return sendErrorResponse(res, 400, error.details[0].message);
            }
            
            if (!isValidObjectId(country)) {
                return sendErrorResponse(res, 400, "Invalid country id");
            }

            const countryDetails = await Country.findOne({
                _id: country,
                isDeleted: false,
            });
            if (!countryDetails) {
                return sendErrorResponse(res, 400, "Country not found");
            }

            if (!req.file?.path) {
                return sendErrorResponse(res, 400, "Sample visa is required");
            }
            
            let sampleVisa;
            if (req.file?.path) {
                sampleVisa = "/" + req.file.path.replace(/\\/g, "/");
            }

            console.log(req.body , "body ")
            const newVisa = new Visa({
                country,
                name,
                documents,
                inclusions,
                description,
                faqs,
                details,
                keywords,
                sampleVisa,
            });
            await newVisa.save();

            res.status(200).json(newVisa);
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    addNewVisaType: async (req, res) => {
        try {
            const {
                visa,
                visaName,
                processingTimeFormat,
                processingTime,
                stayPeriodFormat,
                stayPeriod,
                validityTimeFormat,
                validity,
                entryType,
                embassyCharge,
                serviceCharge,
                ageFrom,
                ageTo,
            } = req.body;

            const { _, error } = visaTypeSchema.validate(req.body);
            if (error) {
                return sendErrorResponse(res, 400, error.details[0].message);
            }

            if (!isValidObjectId(visa)) {
                return sendErrorResponse(res, 400, "Invalid country visa id");
            }

            const visaDetails = await Visa.findById(visa);
            if (!visaDetails) {
                return sendErrorResponse(res, 404, "Country Visa not found");
            }

            const newVisaType = new VisaType({
                visa,
                visaName,
                processingTimeFormat,
                processingTime,
                stayPeriodFormat,
                stayPeriod,
                validityTimeFormat,
                validity,
                entryType,
                embassyCharge,
                serviceCharge,
                ageFrom,
                ageTo,
            });
            await newVisaType.save();

            res.status(200).json(newVisaType);
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    listAllVisa : async(req,res)=>{
        try{
           

            const visaList = await Visa.find({isDeleted : false});

            if(!visaList){
                sendErrorResponse(res, 400,  "Visa not found" );

            }
            
            res.status(200).json(visaList);

        }catch(error){

            sendErrorResponse(res, 500, err);


        }
    } , 
    

    listAllVisaType : async(req,res)=>{

        try{

            const visaTypeList = await VisaType.find({ isDeleted : false });

            if(!visaTypeList){
                sendErrorResponse(res, 400,  "visaType not found" );

            }

            res.status(200).json(visaTypeList);

        }catch(error){

            sendErrorResponse(res, 500, err);

        }
    },
    
    getSingleVisa : async(req,res)=>{

        try{
           
            const { visaId } = req.params;


            if (!isValidObjectId(visaId)) {
                return sendErrorResponse(res, 400, "Invalid Visa id");
            }

            const visa = await Visa.find({_id : id , isDeleted : false });

            if(!visa){
                sendErrorResponse(res, 400,  "Visa not found" );

            }
            
            res.status(200).json(visa);

        }catch(err){

            sendErrorResponse(res, 500, err);


        }
    } , 

    getSingleVisaType : async(req,res)=>{

        try{

            const { id } = req.params;


            if (!isValidObjectId(id)) {
                return sendErrorResponse(res, 400, "Invalid VisaType id");
            }

            const visaType = await VisaType.findOne({_id : id , isDeleted : false });

            if(!visaType){
                sendErrorResponse(res, 400,  "visaType not found" );

            }

            res.status(200).json(visaType);

        }catch(err){

            sendErrorResponse(res, 500, err);

        }

    },

    updateVisa : async(req,res)=>{

        try{
             
            const { id } = req.params;

           

            const {
                country,
                name,
                documents,
                inclusions,
                description,
                faqs,
                details,
                keywords,
                sampleVisa

            } = req.body;

            if (!isValidObjectId(id)) {
                return sendErrorResponse(res, 400, "Invalid visa id");
            }

           
            if (!isValidObjectId(country)) {
                return sendErrorResponse(res, 400, "Invalid country id");
            }

            const countryDetails = await Country.findOne({
                _id: country,
                isDeleted: false,
            });
            if (!countryDetails) {
                return sendErrorResponse(res, 400, "Country not found");
            }

            

            if (req.file?.path) {
                sampleVisa = "/" + req.file.path.replace(/\\/g, "/");
            }
            
            const updatedVisa = await Visa.findByIdAndUpdate(
                id,
                {
                country,
                name,
                documents,
                inclusions,
                description,
                faqs,
                details,
                keywords,
                sampleVisa,
                },
                { runValidators: true, new: true }
            );

            res.status(200).json(updatedVisa);



        }catch(err){
            sendErrorResponse(res, 500, err);


        }
    },

    updateVisaType : async(req,res)=>{

        try{

            const { id } = req.params;


            const {
                visa,
                visaName,
                processingTimeFormat,
                processingTime,
                stayPeriodFormat,
                stayPeriod,
                validityTimeFormat,
                validity,
                entryType,
                embassyCharge,
                serviceCharge,
                ageFrom,
                ageTo,
            } = req.body;


            
            if (!isValidObjectId(id)) {
                return sendErrorResponse(res, 400, "Invalid VisaType id");
            }

          

            if (!isValidObjectId(visa)) {
                return sendErrorResponse(res, 400, "Invalid country visa id");
            }

            const visaDetails = await Visa.findById(visa);
            if (!visaDetails) {
                return sendErrorResponse(res, 404, "Country Visa not found");
            }
            

            const updatedVisaType = await VisaType.findByIdAndUpdate(
                id,
                {
                visa,
                visaName,
                processingTimeFormat,
                processingTime,
                stayPeriodFormat,
                stayPeriod,
                validityTimeFormat,
                validity,
                entryType,
                embassyCharge,
                serviceCharge,
                ageFrom,
                ageTo,
                },
                { runValidators: true, new: true }
            );

            res.status(200).json(updatedVisaType);





        }catch(err){

            sendErrorResponse(res, 500, err);


        }
    },

    deleteVisaType: async (req, res) => {
        try {
            const { id } = req.params;

            if (!isValidObjectId(id)) {
                return sendErrorResponse(res, 400, "Invalid VisaType id");
            }

            const visaType = await VisaType.findByIdAndUpdate(id, {
                isDeleted: true,
            });

            if (!visaType) {
                return sendErrorResponse(res, 400, "VisaType not found");
            }

            res.status(200).json({
                message: "visaType successfully deleted",
                _id: id,
            });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },

    deleteVisa : async(req,res)=>{

        try {
            const { id } = req.params;

            if (!isValidObjectId(id)) {
                return sendErrorResponse(res, 400, "Invalid Visa id");
            }

            const visaType = await Visa.findByIdAndUpdate(id, {
                isDeleted: true,
            });
            
            if (!visaType) {
                return sendErrorResponse(res, 400, "Visa not found");
            }

            res.status(200).json({
                message: "visa successfully deleted",
                _id: id,
            });
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }


    }



};
