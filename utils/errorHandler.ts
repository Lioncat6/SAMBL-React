import logger from "./logger"

interface ErrorWithCode extends Error {
    code?: string | number;
}

class ErrorHandler {
    private namespace: string;

    constructor(namespace: string) {
        this.namespace = namespace;
    }

    handleError(
        message: string,
        error: Error,
        code?: string | number,
        throwError: boolean = true,
        ErrorType: typeof Error = Error
    ): void {
        const errorMessage = message ? message.replace(`[${this.namespace}]: `, "") + error.message ? error.message.replace(`[${this.namespace}]: `, "") : "": null;
        if (message.includes("ETIMEDOUT") || message.includes("ECONNRESET")) {

        }
        const logMessage = `[${this.namespace}]: ${errorMessage  || "Internal Server Error"}`;
        logger.error(logMessage, error);
        const err = new ErrorType(logMessage) as ErrorWithCode;
        if (code) err.code = code;
        if (throwError) throw err;
    }
}

export default ErrorHandler;