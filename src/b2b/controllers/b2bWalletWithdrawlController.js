const { sendErrorResponse, sendMobileOtp } = require("../../helpers");
const { Country } = require("../../models");
const { isValidObjectId, Types } = require("mongoose");

const {
  B2BBankDetails,
  B2BTransaction,
  B2BWalletWithdraw,
  B2BWallet,
} = require("../models");
const b2bBankDetailsValidationSchema = require("../validations/b2bBankDetails.schema");
const { generateUniqueString } = require("../../utils");

module.exports = {
  walletWithdrawalInitate: async (req, res) => {
    try {
      const {
        bankDeatilId,
        isoCode,
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

        country = await Country.findOne({ isocode: isoCode });

        if (!country) {
          return sendErrorResponse(res, 400, "Country Not Found");
        }

        if (isoCode === "IN" && ifscCode == "") {
          return sendErrorResponse(res, 400, "IFSC Code is required");
        }

        bankDeatils = new B2BBankDetails({
          bankName,
          bankCountry: country.isocode,
          countryId: country._id,
          accountHolderName,
          accountNumber,
          ifscCode,
          ibanCode,
        });
        await bankDeatils.save();
      } else {
        if (!isValidObjectId(bankDeatilId)) {
          return sendErrorResponse(res, 400, "Invalid Withdraw Request  Id");
        }

        bankDetails = await B2BBankDetails.findById(bankDeatilId);
      }

      let wallet = await B2BWallet.findOne({
        reseller: req.reseller._id,
      });

      if (wallet.balance < amount || amount < 0) {
        return sendErrorResponse(
          res,
          400,
          "Please Request Valid Amount Or Check Wallet Balance "
        );
      }

      const otp = "12345";

      const walletWithdraw = new B2BWalletWithdraw({
        resellerId: req.reseller._id,
        bankDetailsId: bankDeatils._id,
        amount,
        status: "initiated",
        otp,
        referenceNo: generateUniqueString("B2BWR"),

      });

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

      let wallet = await B2BWallet.findOne({
        reseller: req.reseller._id,
      });
      if (!wallet) {
        wallet = new B2BWallet({
          balance: 0,
          reseller: req.reseller._id,
        });
      }

      wallet.balance -= Number(withdrawRequest.amount);
      await wallet.save();

      withdrawRequest.status = "pending";

      await withdrawRequest.save();

      await transaction.save();

      res
        .status(200)
        .json({ success: "Wallet Withdraw Success Wait For Confirmation" });
    } catch (err) {
      sendErrorResponse(res, 500, err);
    }
  },
};
