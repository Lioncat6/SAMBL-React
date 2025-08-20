import logger from "./logger"

class ErrorHandler {
    constructor(namespace) {
        this.namespace = namespace;
    }

    handleError(message, error, code = null, ErrorType = Error) {
        const logMessage = `[${this.namespace}]: ${message || "Internal Server Error"}`;
        logger.error(logMessage, error);

        const err = new ErrorType(logMessage);
        if (code) err.code = code;
        throw err;
    }
}

export default ErrorHandler;