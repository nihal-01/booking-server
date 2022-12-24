const sendErrorResponse = (res, status, err) => {
    return res.status(status ? status : 500).json({
        error: err.message
            ? err.message
            : err
            ? err
            : "something went wrong, Try again!",
        status: status,
    });
};

module.exports = sendErrorResponse;
