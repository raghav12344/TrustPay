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

    const maxRetries = 2;
    let lastError = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            if (attempt > 1) {
                console.log(`[ML_SERVICE] Retrying call to ML service (Attempt ${attempt}/${maxRetries})...`);
            }

            const response = await axios.post(
                `${ML_SERVICE_URL}/api/analyze`,
                transaction,
                {
                    timeout: 35000,
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
            lastError = error;
            const status = error.response ? error.response.status : null;

            // If Render returned 502/503/504 or connection reset during spin-up, wait and retry once
            if ((status === 502 || status === 503 || status === 504 || error.code === "ECONNRESET") && attempt < maxRetries) {
                console.warn(`[ML_SERVICE] Received HTTP ${status} (container waking up). Retrying in 3 seconds...`);
                await new Promise((resolve) => setTimeout(resolve, 3000));
                continue;
            }

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
    }

    throw lastError;
};

module.exports = {
    analyzeTransaction,
};