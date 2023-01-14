const { sendErrorResponse } = require("../../helpers");
const Reseller = require("../models/reseller.model");
const { hash, compare } = require("bcryptjs");



module.exports = {

  resellerRegister: async (req, res) => {
    try {

      const { email, companyName, address, website, country, city, zipCode, designation, name, mobileNumber, skypeId, whatsappNumber, password, resellerId } = req.body


      const resellerReg = await Reseller.findOne({ email });

      if (resellerReg) {
        return sendErrorResponse(res, 400, "Email already exists");
      }


      const hashedPassowrd = await hash(password, 8);

      const newReseller = new Reseller({
        email: email,
        companyName: companyName,
        address: address,
        website: website,
        country: country,
        city: city,
        zipCode: zipCode,
        designation: designation,
        name: name,
        mobileNumber: mobileNumber,
        skypeId: skypeId,
        whatsappNumber: whatsappNumber,
        resellerId: resellerId,
        password: hashedPassowrd,

      });
      

      

      console.log(newReseller , "newReseller")
      let resp = await newReseller.save();
      res.status(200).json(resp);

    } catch (err) {

      sendErrorResponse(res, 500, err);


    }

  },

  resellerLogin: async(req, res) => {

    try {

       
          const { agentCode, email, password } = req.body;
         

          console.log(req.body , "bodyyy")

          const reseller = await Reseller.findOne({ email });
          if (!reseller) {
              return sendErrorResponse(res, 400, "Invalid credentials");
          }
          

          if (reseller.agentCode !== agentCode) {
              return sendErrorResponse(res, 400, "Invalid agentCode ");
          }

          const isMatch = await compare(password, reseller.password);
          if (!isMatch) {
              return sendErrorResponse(res, 400, "Invalid credentials pass");
          }
         
          console.log(isMatch , "123456")
          // const jwtToken = await reseller.generateAuthToken();

          // console.log(jwtToken , "jwt token")
          // await user.save();

          res.status(200).json({ isMatch });
      } catch (err) {
          sendErrorResponse(res, 500, err);
      }




   
  }


}