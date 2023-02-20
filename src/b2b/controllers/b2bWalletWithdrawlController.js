const { sendErrorResponse, sendMobileOtp } = require("../../helpers");
const { Country } = require("../../models");
const { isValidObjectId, Types } = require("mongoose");

const {
  B2BBankDetails,
  B2BTransaction,
  B2BWalletWithdraw,
} = require("../models");
const b2bBankDetailsValidationSchema = require("../validations/b2bBankDetails.schema");

module.exports = {
  walletWithdrawalInitate: async (req, res) => {
    try {
      const {
        bankDeatilId,
        bankCountry,
        bankName,
        accountHolderName,
        accountNumber,
        ifscCode,
        ibanCode,
        amount,
      } = req.body;

      let bankDeatils;
      let country;

      if (!bankDeatilId) {
        const { _, error } = b2bBankDetailsValidationSchema.validate(req.body);
        if (error) {
          return sendErrorResponse(
            res,
            400,
            error.details ? error?.details[0]?.message : error.message
          );
        }

        console.log(req.body, "body");
        country = await Country.findOne({ countryName: bankCountry });

        if (!country) {
          return sendErrorResponse(res, 400, "Country Not Found");
        }

        bankDeatils = new B2BBankDetails({
          bankName,
          bankCountry,
          countryId: country._id,
          accountHolderName,
          accountNumber,
          ifscCode,
          ibanCode,
        });
        await bankDeatils.save();
        console.log(bankDeatils, "body2");
      } else {
        if (!isValidObjectId(bankDeatilId)) {
          return sendErrorResponse(res, 400, "Invalid Withdraw Request  Id");
        }

        bankDetails = await B2BBankDetails.findById(bankDeatilId);
      }

      const otp = "12345";
      //   const otp = await sendMobileOtp(countryDetail.phonecode, contactNo);
      console.log(otp, "otp");

      console.log(bankDeatils, "bankDeatils");

      const walletWithdraw = new B2BWalletWithdraw({
        resellerId: req.reseller._id,
        bankDetailsId: bankDeatils._id,
        amount,
        status: "pending",
        otp,
      });
      console.log(otp, "otp2");

      await walletWithdraw.save();

      res.status(200).json({ withdrawRequestId: walletWithdraw._id });
    } catch (err) {
      console.log(err, "error");
      sendErrorResponse(res, 500, err);
    }
  },

  walletWithdrawalComplete: async (req, res) => {
    try {
      const { id } = req.params;
      const { otp } = req.body;

      if (!isValidObjectId(id)) {
        return sendErrorResponse(res, 400, "Invalid Withdraw Request  Id");
      }

      const withdrawRequest = await B2BWalletWithdraw.findById(id);

      console.log(withdrawRequest, id, "withdrawRequest");

      if (!withdrawRequest) {
        return sendErrorResponse(res, 400, "Invalid withdrawRequest Details");
      }

      if (!withdrawRequest.otp || withdrawRequest.otp !== Number(otp)) {
        return sendErrorResponse(res, 400, "incorrect otp!");
      }

      const transaction = new B2BTransaction({
        reseller: req.reseller?._id,
        transactionType: "withdraw",
        status: "pending",
        paymentProcessor: "wallet",
        amount: withdrawRequest.amount,
        order: withdrawRequest._id,
      });

      await transaction.save();

      res
        .status(200)
        .json({ success: "Wallet Withdraw Success Wait For Confirmation" });
    } catch (err) {
      sendErrorResponse(res, 500, err);
    }
  },
};
