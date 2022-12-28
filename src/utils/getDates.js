function getDates(startDate, stopDate) {
    var dateArray = [];
    var currentDate = new Date(startDate);
    var stopDate = new Date(stopDate);
    while (currentDate <= stopDate) {
        dateArray.push(currentDate.toISOString().split("T")[0]);
        currentDate = new Date(currentDate.setDate(currentDate.getDate() + 1));
    }
    return dateArray;
}

module.exports = getDates;
