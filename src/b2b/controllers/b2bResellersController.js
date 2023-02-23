const { hash } = require("bcryptjs");
const crypto = require("crypto");
const { isValidObjectId, Types } = require("mongoose");

const { sendErrorResponse, sendMobileOtp } = require("../../helpers");
const { sendSubAgentPassword } = require("../helpers");
const sendForgetPasswordOtp = require("../helpers/sendForgetPasswordMail");
const { Reseller, B2BTransaction, B2BWallet } = require("../models");
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

      const reseller = await Reseller.findById(id)
        .populate("country", "countryName flag phonecode")
        .select("-jwtToken -password")
        .lean();

      if (!reseller) {
        return sendErrorResponse(res, 400, "subAgent not Found ");
      }

      const wallet = await B2BWallet.findOne({ reseller: reseller?._id });

      let totalEarnings = [];
      let pendingEarnings = [];
      if (wallet) {
        totalEarnings = await B2BTransaction.aggregate([
          {
            $match: {
              reseller: reseller?._id,
              status: "success",
              transactionType: "markup",
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: "$amount" },
            },
          },
        ]);

        pendingEarnings = await B2BTransaction.aggregate([
          {
            $match: {
              reseller: reseller?._id,
              status: "pending",
              transactionType: "markup",
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: "$amount" },
            },
          },
        ]);
      }
      res.status(200).json({
        subAgent: reseller,
        balance: wallet ? wallet.balance : 0,
        totalEarnings: totalEarnings[0]?.total || 0,
        pendingEarnings: pendingEarnings[0]?.total || 0,
      });


      // res.status(200).json({ subAgent });
    } catch (err) {
      console.log(err, "error");
      sendErrorResponse(res, 500, err);
    }
  },

  forgetPassword: async (req, res) => {
    try {
      const { email } = req.body;

      const reseller = await Reseller.findOne({ email: email });

      if (!reseller) {
        return sendErrorResponse(res, 404, "Account not found");
      }

      const otp = 12345;

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

      res.status(200).json({ message: "Password Updated Sucessfully" });
    } catch (err) {
      sendErrorResponse(res, 500, err);
    }
  },

  deleteSubAgent: async (req, res) => {
    try {
      const { resellerId } = req.params;

      if (!isValidObjectId(resellerId)) {
        return sendErrorResponse(res, 400, "invalid reseller id");
      }

      const subAgent = await Reseller.findById(resellerId);

      if (!subAgent) {
        return sendErrorResponse(res, 400, "subAgent not found");
      }

      if (subAgent.referredBy == req.reseller._id) {
        return sendErrorResponse(res, 400, "subAgent not Found ");
      }

      subAgent.status = "disabled";

      await subAgent.save();

      res
        .status(200)
        .json({ message: "SubAgent Has Been Disabled Successfully" });
    } catch (err) {
      sendErrorResponse(res, 500, err);
    }
  },

 
};
