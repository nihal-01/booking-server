const { isValidObjectId } = require("mongoose");

const { sendErrorResponse } = require("../../helpers");
const { Reseller, B2BTransaction, B2BWallet } = require("../../b2b/models");
const { B2BWalletWithdraw } = require("../../b2b/models");

module.exports = {
  addMoneyToB2bWallet: async (req, res) => {
    try {
      const { resellerId, amount, referenceNo, paymentProcessor } = req.body;

      if (!isValidObjectId(resellerId)) {
        return sendErrorResponse(res, 400, "invalid reseller id");
      }

      const reseller = await Reseller.findOne({
        _id: resellerId,
        $or: [{ status: "ok" }, { status: "disabled" }],
      });

      if (!reseller) {
        return sendErrorResponse(res, 400, "reseller not found or not active");
      }

      if (Number(amount) <= 0) {
        return sendErrorResponse(
          res,
          400,
          "amount should be greater than zero"
        );
      }

      const newTransaction = new B2BTransaction({
        reseller: resellerId,
        transactionType: "deposit",
        paymentProcessor,
        amount,
        status: "pending",
        referenceNo,
        depositor: req.admin?._id,
      });

      let wallet = await B2BWallet.findOne({ reseller: resellerId });
      if (!wallet) {
        wallet = new B2BWallet({
          balance: 0,
          reseller: resellerId,
        });
      }

      wallet.balance += Number(amount);
      await wallet.save();

      newTransaction.status = "success";
      await newTransaction.save();

      res.status(200).json(newTransaction);
    } catch (err) {
      sendErrorResponse(res, 500, err);
    }
  },

  listAllWithdrawRequest: async (req, res) => {
    try {
      const { skip = 0, limit = 10, search } = req.query;

      console.log("call reached");

      const walletRequestDetails = await B2BWalletWithdraw.aggregate([
        {
          $lookup: {
            from: "resellers",
            localField: "resellerId",
            foreignField: "_id",
            as: "reseller",
          },
        },
        // {
        //   $match: {
        //     "reseller.name": { $regex: search, $options: "i" },
        //   },
        // },
        {
          $lookup: {
            from: "b2bbankdetails",
            localField: "bankDetailsId",
            foreignField: "_id",
            as: "bankDetails",
          },
        },
        {
          $set: {
            reseller: {
              $arrayElemAt: ["$reseller", 0],
            },
            bankDetails: {
              $arrayElemAt: ["$bankDetails", 0],
            },
          },
        },
        // { $skip: Number(skip) },
        // { $limit: Number(limit) },
      ]);

      console.log(walletRequestDetails, "walletRequestDetails");

      //   const totalWithdrawRequests = await B2BWalletWithdraw.countDocuments(
      //     filters
      //   );

      res.status(200).json({
        walletRequestDetails,
        // totalWithdrawRequests,
        // skip: Number(skip),
        // limit: Number(limit),
      });
    } catch (err) {
      sendErrorResponse(res, 500, err);
    }
  },

  onApproveWithdrawal: async (req, res) => {
    try {
      const { id } = req.params;
      const { referenceNumber } = req.body.formData;

      console.log(referenceNumber, req.body, "referenceNumber");

      if (!isValidObjectId(id)) {
        return sendErrorResponse(res, 400, "invalid  id");
      }

      const b2bWalletWithdraw = await B2BWalletWithdraw.findById(id);

      if (!b2bWalletWithdraw) {
        return sendErrorResponse(res, 400, "Wallet Withdraw History not found");
      }

      b2bWalletWithdraw.referenceNo = referenceNumber;

      const transation = await B2BTransaction.findOne({
        order: b2bWalletWithdraw._id,
      });

      if (!transation) {
        return sendErrorResponse(res, 400, "Transation not found");
      }

      b2bWalletWithdraw.status = "confirmed";
      await b2bWalletWithdraw.save();

      transation.status = "success";
      await transation.save();

      let wallet = await B2BWallet.findOne({
        reseller: b2bWalletWithdraw.resellerId,
      });
      if (!wallet) {
        wallet = new B2BWallet({
          balance: 0,
          reseller: b2bWalletWithdraw.resellerId,
        });
      }

      wallet.balance -= Number(b2bWalletWithdraw.amount);
      await wallet.save();

      res.status(200).json({ success: "Withdraw Was Successful" });
    } catch (err) {
      console.log(err, "error");
      sendErrorResponse(res, 500, err);
    }
  },
};
