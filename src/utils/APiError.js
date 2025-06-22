class ApiError extends Error {
    constructor(
        statusCode,
        message = "Something went wrong",
        errors = [],
        stack = ""
    ) {
        super(message); // Call the parent Error constructor with the message
        this.statusCode = statusCode;
        this.data = null; // Can be used to send additional data
        this.message = message;
        this.success = false; // Indicates failure
        this.errors = errors;

        // Capture the stack trace, excluding the ApiError constructor itself
        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor); // Corrected line
        }
    }
}

export { ApiError };