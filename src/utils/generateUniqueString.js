const generateUniqueString = (prefix) => {
    let min = 100;
    let max = 999;
    const result =
        prefix +
        "_" +
        new Date().getTime() +
        Math.floor(Math.random() * (max - min + 1) + min);

    return result;
};

module.exports = generateUniqueString;
