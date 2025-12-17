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
        error: unknown,
        code?: string | number,
        throwError: boolean = true,
        ErrorType: typeof Error = Error
    ): void {
        const logMessage = `[${this.namespace}]: ${message || "Internal Server Error"}`;
        logger.error(logMessage, error);

        const err = new ErrorType(logMessage) as ErrorWithCode;
        if (code) err.code = code;
        if (throwError) throw err;
    }
}

export default ErrorHandler;