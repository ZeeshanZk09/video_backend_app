export class ApiResponse<T = any> {
  statusCode: number;
  data: T | null;
  message: string;
  success: boolean;

  constructor(
    statusCode: number,
    data: T | null = null,
    message: string = "Success"
  ) {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
  }
}
