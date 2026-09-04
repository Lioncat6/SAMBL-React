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
        error?: Error,
        response?: Response,
        responseText?: string, //TODO: Determine this in this function; Might require async
        throwError: boolean = true
    ): void {
        let errorMessage = (error?.message ? `${message} | ${error.message}` : message || null)?.replace(/\[\w+]:/, "");
        if (response && !response.ok) errorMessage += ` / ${response.status}${responseText && ` - ${responseText}`}`
        if (message.includes("ETIMEDOUT") || message.includes("ECONNRESET")) {

        }
        const logMessage = `[${this.namespace}]: ${errorMessage || "Internal Server Error"}`;
        logger.error(logMessage);
        if (error) logger.error(error);
        const err = new Error(logMessage) as ErrorWithCode;
        if (response) err.code = response.status;
        if (throwError) throw err;
    }
}

export default ErrorHandler;