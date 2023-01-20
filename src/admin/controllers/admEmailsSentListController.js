module.exports = {
    // getAllSentEmailsList: async (req, res) => {
    //     try {
    //         const { skip = 0, limit = 10 } = req.query;
    //         const emails = await EmailSendList.find({})
    //             .sort({
    //                 createdAt: -1,
    //             })
    //             .limit(limit)
    //             .skip(limit * skip);
    //         const totalEmails = await EmailSendList.count();
    //         res.status(200).json({
    //             emails,
    //             skip: Number(skip),
    //             limit: Number(limit),
    //             totalEmails,
    //         });
    //     } catch (err) {
    //         sendErrorResponse(res, 500, err);
    //     }
    // },
};
