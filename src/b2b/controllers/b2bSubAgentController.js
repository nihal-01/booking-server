const { hash, compare } = require("bcryptjs");
const crypto = require("crypto");
const { isValidObjectId } = require("mongoose");

const { sendErrorResponse } = require("../../helpers");
const sendSubAgentPassword = require("../helpers/sendSubAgentPassword");
const SubAgent = require("../models/subAgent.model");
const { subAgentRegisterSchema } = require("../validations/b2bSubAgent.schema");

module.exports = {
    
    registerSubAgent : async(req,res)=>{
        try {
            const {
              email,
              companyName,
              address,
              companyRegistration,
              trnNumber,
              website,
              country,
              city,
              zipCode,
              designation,
              name,
              phoneNumber,
              skypeId,
              whatsappNumber,
              referredBy,
            } = req.body;
      
            const { _, error } =   subAgentRegisterSchema.validate(req.body);
            if (error) {
              return sendErrorResponse(
                res,
                400,
                error.details ? error?.details[0]?.message : error.message
              );
            }
      
            const subAgentReg = await SubAgent.findOne({ email });
      
            if (subAgentReg) {
              return sendErrorResponse(res, 400, "Email already exists");
            }
      
            const password = crypto.randomBytes(6).toString("hex");
            const hashedPassowrd = await hash(password, 8);
            
            // console.log(password)

            sendSubAgentPassword({ email, password });

      
            const newSubAgent = new SubAgent({
              email,
              companyName,
              address,
              website,
              country,
              city,
              zipCode,
              designation,
              name,
              phoneNumber,
              skypeId,
              whatsappNumber,
              referredBy,
              trnNumber,
              companyRegistration,
              password: hashedPassowrd,
              status: "pending",
            });
      
            await newSubAgent.save();
            res.status(200).json({
              message: "Your requeset has been successfully submitted",
            });
          } catch (err) {
            sendErrorResponse(res, 500, err);
          }

    }
}


