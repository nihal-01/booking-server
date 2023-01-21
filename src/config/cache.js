const mongoose = require("mongoose");
const redis = require("redis");
const util = require("util");

const redisUrl = "redis://127.0.0.1:6379";
const client = redis.createClient(redisUrl);
client.connect().then(() => {
    console.log("Redis server connected");
});
client.get = util.promisify(client.get);

mongoose.Query.prototype.cache = function () {
    this.useCache = true;

    return this;
};

const exec = mongoose.Query.prototype.exec;

mongoose.Query.prototype.exec = async function () {
    if (!this.useCache) {
        return exec.apply(this, arguments);
    }

    const key = JSON.stringify({
        ...this.getQuery(),
        collection: this.mongooseCollection.name,
        op: this.op,
        options: this.options,
    });

    const cacheValue = await client.GET(key);

    if (cacheValue) return JSON.parse(cacheValue);

    const result = await exec.apply(this, arguments);

    if (result) {
        client.SET(key, JSON.stringify(result));
        return result;
    } else {
        return null;
    }
};

module.exports = function clearCache(hashkey) {
    client.del(JSON.stringify(hashkey));
};
