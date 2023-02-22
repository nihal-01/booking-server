const { hash } = require("bcryptjs");
const crypto = require("crypto");
const { isValidObjectId, Types } = require("mongoose");

const { sendErrorResponse } = require("../../helpers");
const { sendSubAgentPassword } = require("../helpers");
const sendForgetPasswordOtp = require("../helpers/sendForgetPasswordMail");
const { Reseller } = require("../models");
const {
  subAgentRegisterSchema,
  resellerForgetPasswordSchema,
} = require("../validations/b2bReseller.schema");

module.exports = {
  registerSubAgent: async (req, res) => {
    try {
      const {
        email,
        companyName,
        address,
        telephoneNumber,
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
      } = req.body;

      const { _, error } = subAgentRegisterSchema.validate(req.body);
      if (error) {
        return sendErrorResponse(
          res,
          400,
          error.details ? error?.details[0]?.message : error.message
        );
      }

      const prevReseller = await Reseller.findOne({ email });

      if (prevReseller) {
        return sendErrorResponse(res, 400, "Email already exists");
      }

      const password = crypto.randomBytes(6).toString("hex");
      const hashedPassowrd = await hash(password, 8);

      const newSubAgent = new Reseller({
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
        telephoneNumber,
        referredBy: req.reseller._id,
        trnNumber,
        companyRegistration,
        role: "sub-agent",
        password: hashedPassowrd,
        status: "ok",
      });

      await newSubAgent.save((error, subAgent) => {
        if (error) {
          return res.status(400).json({
            message: error.message,
          });
        }

        let agentCode = subAgent.agentCode;
        sendSubAgentPassword(email, password, agentCode);

        return res.status(200).json({
          message: "Sub-agent created successfully.",
          data: {
            agentCode: subAgent.agentCode,
          },
        });
      });
    } catch (err) {
      sendErrorResponse(res, 500, err);
    }
  },

  listResellers: async (req, res) => {
    try {
      const { search } = req.query;

      const filter = {
        referredBy: req.reseller.id,
      };

      if (search && search !== "") {
        filter.$or = [
          { name: { $regex: search, $options: "i" } },
          { companyName: { $regex: search, $options: "i" } },
        ];
      }

      const resellerList = await Reseller.find(filter).select(
        "-jwtToken -password"
      );

      if (!resellerList) {
        sendErrorResponse(res, 500, "No Resellers Found");
      }

      res.status(200).json(resellerList);
    } catch (err) {
      console.log(err, "error");
      sendErrorResponse(res, 500, err);
    }
  },

  getSingleSubAgent: async (req, res) => {
    try {
      const { id } = req.params;

      if (!isValidObjectId(id)) {
        return sendErrorResponse(res, 400, "Invalid reseller id");
      }

      const subAgent = await Reseller.findById(id)
        .populate("country", "countryName flag phonecode")
        .select("-jwtToken -password")
        .lean();
      if (!subAgent) {
        return sendErrorResponse(res, 404, "SubAgent not found");
      }

      res.status(200).json({ subAgent });
    } catch (err) {
      console.log(err, "error");
      sendErrorResponse(res, 500, err);
    }
  },

  forgetPassword: async (req, res) => {
    try {
      const { email } = req.body;

      const reseller = await Reseller.findOne({ email });

      if (!reseller) {
        return sendErrorResponse(res, 404, "Account not found");
      }

      const otp = await sendMobileOtp(countryDetail.phonecode, phoneNumber);

      await sendForgetPasswordOtp(reseller, otp);

      reseller.otp = otp;

      await reseller.save();

      res.status(200).json({ message: "otp sended to mail id" });
    } catch (err) {
      sendErrorResponse(res, 500, err);
    }
  },

  confirmOtpForgetPassword: async (req, res) => {
    try {
      const { email, otp, newPassword, confirmPassword } = req.body;

      const { _, error } = resellerForgetPasswordSchema.validate(req.body);
      if (error) {
        return sendErrorResponse(
          res,
          400,
          error.details ? error?.details[0]?.message : error.message
        );
      }

      const reseller = await Reseller.findOne({ email });

      if (!reseller) {
        return sendErrorResponse(res, 404, "Account not found");
      }

      if (reseller.otp !== Number(otp)) {
        return sendErrorResponse(res, 404, "OTP Is Wrong");
      }

      const hashedPassowrd = await hash(newPassword, 8);

      reseller.password = hashedPassowrd;

      await reseller.save();
    } catch (err) {
      sendErrorResponse(res, 500, err);
    }
  },
};
