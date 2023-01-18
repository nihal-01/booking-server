const { sendErrorResponse } = require("../../helpers");
const Reseller = require("../models/reseller.model");
const { hash } = require("bcryptjs");



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

      let resp = await newReseller.save();
      res.status(200).json(resp);

    } catch (err) {

      sendErrorResponse(res, 500, err);


    }

  }
}