const amqp = require("amqplib");

const RABBITMQ_URL =
    process.env.RABBITMQ_URL || "amqp://guest:guest@localhost:5672";

const FRAUD_EVALUATION_QUEUE =
    process.env.FRAUD_EVALUATION_QUEUE || "fraud_evaluation_queue";

let connection = null;
let channel = null;
let isConnecting = false;

/**
 * Initializes the RabbitMQ connection and asserts the durable
 * `fraud_evaluation_queue` for asynchronous ML/GenAI processing.
 */
const initRabbitMQ = async () => {
    if (channel) {
        return channel;
    }

    if (isConnecting) {
        return null;
    }

    isConnecting = true;

    try {
        console.log(`[RABBITMQ] Connecting to broker at ${RABBITMQ_URL}...`);
        connection = await amqp.connect(RABBITMQ_URL);

        connection.on("error", (err) => {
            console.error("[RABBITMQ] Connection error:", err.message);
            channel = null;
            connection = null;
        });

        connection.on("close", () => {
            console.warn(
                "[RABBITMQ] Connection closed. Reconnecting in 5s..."
            );
            channel = null;
            connection = null;
            setTimeout(() => {
                initRabbitMQ().catch(() => {});
            }, 5000);
        });

        channel = await connection.createChannel();

        await channel.assertQueue(FRAUD_EVALUATION_QUEUE, {
            durable: true,
        });

        console.log(
            `[RABBITMQ] Connected and queue '${FRAUD_EVALUATION_QUEUE}' asserted.`
        );
        return channel;
    } catch (error) {
        console.warn(
            `[RABBITMQ] Could not connect to broker (${error.message}). Will retry on publish.`
        );
        channel = null;
        connection = null;
        return null;
    } finally {
        isConnecting = false;
    }
};

/**
 * Publishes a transaction evaluation job to `fraud_evaluation_queue`.
 *
 * @param {Object} payload - Transaction & telemetry payload for ML/GenAI evaluation.
 * @returns {Promise<boolean>} True if published to RabbitMQ queue, false if broker unavailable.
 */
const publishFraudEvaluation = async (payload) => {
    try {
        if (!channel) {
            await initRabbitMQ();
        }

        if (!channel) {
            throw new Error("RabbitMQ channel is not available");
        }

        const messageBuffer = Buffer.from(JSON.stringify(payload));

        const sent = channel.sendToQueue(
            FRAUD_EVALUATION_QUEUE,
            messageBuffer,
            {
                persistent: true,
                contentType: "application/json",
                timestamp: Date.now(),
            }
        );

        console.log(
            `[RABBITMQ] Published transaction #${payload.transaction_id} to '${FRAUD_EVALUATION_QUEUE}'`
        );
        return sent;
    } catch (error) {
        console.error(
            `[RABBITMQ] Failed to publish transaction #${payload.transaction_id}:`,
            error.message
        );
        return false;
    }
};

/**
 * Lightweight keep-alive check for RabbitMQ connection and queue.
 */
const pingRabbitMQ = async () => {
    try {
        if (!channel) {
            return false;
        }
        await channel.checkQueue(FRAUD_EVALUATION_QUEUE);
        return true;
    } catch {
        return false;
    }
};

module.exports = {
    FRAUD_EVALUATION_QUEUE,
    initRabbitMQ,
    publishFraudEvaluation,
    pingRabbitMQ,
};

