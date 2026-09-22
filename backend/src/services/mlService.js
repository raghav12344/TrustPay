const axios = require("axios");

const ML_SERVICE_URL = process.env.ML_SERVICE_URL;

const analyzeTransaction = async (transaction) => {
    if (!ML_SERVICE_URL) {
        throw new Error("ML_SERVICE_URL is not configured");
    }

    console.log("====================================");
    console.log("CALLING ML SERVICE");
    console.log("URL:", `${ML_SERVICE_URL}/api/analyze`);
    console.log("TRANSACTION:", transaction);
    console.log("====================================");

    try {
        const response = await axios.post(
            `${ML_SERVICE_URL}/api/analyze`,
            transaction,
            {
                timeout: 30000,
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );

        console.log("====================================");
        console.log("ML SERVICE RESPONSE RECEIVED");
        console.log("STATUS:", response.status);
        console.log("DATA:", response.data);
        console.log("====================================");

        return response.data;

    } catch (error) {
        console.error("====================================");
        console.error("ML SERVICE REQUEST FAILED");

        if (error.response) {
            console.error("STATUS:", error.response.status);
            console.error("RESPONSE DATA:", error.response.data);
            console.error("RESPONSE HEADERS:", error.response.headers);
        } else if (error.request) {
            console.error("NO RESPONSE RECEIVED FROM ML SERVICE");
            console.error("REQUEST ERROR:", error.message);
        } else {
            console.error("AXIOS ERROR:", error.message);
        }

        console.error("FULL ERROR:", error);
        console.error("====================================");

        throw error;
    }
};

module.exports = {
    analyzeTransaction,
};