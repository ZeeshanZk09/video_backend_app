interface IApiErrorDetails {
  field?: string;
  message: string;
}

export class ApiError extends Error {
  public statusCode: number;
  public success: false;
  public errors: IApiErrorDetails[];
  public data: null;

  constructor(
    statusCode: number = 500,
    message: string = "Something went wrong",
    errors: IApiErrorDetails[] = [],
    stack?: string
  ) {
    super(message);

    this.statusCode = statusCode;
    this.success = false;
    this.data = null;
    this.errors = errors;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
