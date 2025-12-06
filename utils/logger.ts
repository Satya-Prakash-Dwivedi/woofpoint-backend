import winston from "winston";
import path from "path";

const { combine, timestamp, json } = winston.format;

const logger = winston.createLogger({
    level: 'info',
    format : combine(
        timestamp(),
        json()
    ),
    transports: [
        // Always log to the console
        new winston.transports.Console(),
    ],
});

// In production env always log to a file.
if(process.env.NODE_ENV == 'production'){
    logger.add(new winston.transports.File({filename: path.join(__dirname, '..', '..', 'logs', 'backend.log')}));
}

export default logger;