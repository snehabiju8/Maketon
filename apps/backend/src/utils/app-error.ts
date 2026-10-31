export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = "INTERNAL_SERVER_ERROR",
    isOperational: boolean = true,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;

    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string = "Bad request", code: string = "BAD_REQUEST"): AppError {
    return new AppError(message, 400, code);
  }

  static unauthorized(message: string = "Unauthorized", code: string = "UNAUTHORIZED"): AppError {
    return new AppError(message, 401, code);
  }

  static forbidden(message: string = "Forbidden", code: string = "FORBIDDEN"): AppError {
    return new AppError(message, 403, code);
  }

  static notFound(message: string = "Resource not found", code: string = "NOT_FOUND"): AppError {
    return new AppError(message, 404, code);
  }

  static conflict(message: string = "Resource conflict", code: string = "CONFLICT"): AppError {
    return new AppError(message, 409, code);
  }

  static unprocessable(
    message: string = "Unprocessable entity",
    code: string = "UNPROCESSABLE_ENTITY",
  ): AppError {
    return new AppError(message, 422, code);
  }

  static internal(
    message: string = "Internal server error",
    code: string = "INTERNAL_SERVER_ERROR",
  ): AppError {
    return new AppError(message, 500, code, false);
  }
}
