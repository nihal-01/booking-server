const { sendErrorResponse } = require("../../helpers/");
const { AttractionTicket } = require("../../models");

module.exports = {
    getSingleAttractionTicket: async (req, res) => {
        try {
            const { ticketId } = req.params;

            if (!isValidObjectId(ticketId)) {
                return sendErrorResponse(res, 400, "invalid ticket id");
            }

            const ticket = await AttractionTicket.findOne({
                _id: ticketId,
            }).populate({
                path: "activity",
                populate: {
                    path: "attraction",
                    populate: { path: "destination" },
                    select: "title images",
                },
                select: "name description",
            });

            if (!ticket) {
                return sendErrorResponse(res, 400, "ticket not found");
            }

            res.status(200).json(ticket);
        } catch (err) {
            sendErrorResponse(res, 500, err);
        }
    },
};
