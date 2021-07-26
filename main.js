const { MongoClient } = require("mongodb");
const axios = require("axios");

require("dotenv").config();

const mongoClient = new MongoClient(process.env.MONGODB_URI);

(async () => {
    try {
        await mongoClient.connect();
        const tokenResponse = await axios({
            "method": "POST",
            "url": "https://api.twitter.com/oauth2/token",
            "headers": {
                "Authorization": "Basic " + Buffer.from(`${process.env.API_KEY}:${process.env.API_SECRET}`).toString("base64"),
                "Content-Type": "application/x-www-form-urlencoded"
            },
            "data": "grant_type=client_credentials"
        });
        const tweetResponse = await axios({
            "method": "GET",
            "url": "https://api.twitter.com/1.1/search/tweets.json",
            "headers": {
                "Authorization": "Bearer " + tokenResponse.data.access_token
            },
            "params": {
                "q": "mongodb -filter:retweets filter:safe -from:mongodb -from:realm",
                "lang": "en",
                "count": 100
            }
        });
        console.log(`Next Results: ${tweetResponse.data.search_metadata.next_results}`)
        //console.log(tweetResponse.data.statuses);
        const collection = mongoClient.db(process.env.MONGODB_DATABASE).collection(process.env.MONGODB_COLLECTION);
        tweetResponse.data.statuses = tweetResponse.data.statuses.map(status => {
            status._id = status.id;
            return status;
        });
        const result = await collection.insertMany(tweetResponse.data.statuses);
        console.log(result);
    } finally {
        await mongoClient.close();
    }
})();