import { Response } from "express";

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  code?: string;
  errors?: unknown;
}

export const sendSuccess = <T>(
  res: Response,
  data?: T,
  message: string = "Operation successful",
  statusCode: number = 200,
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    message,
  };

  if (data !== undefined) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

export const sendError = (
  res: Response,
  message: string = "An error occurred",
  statusCode: number = 500,
  code: string = "INTERNAL_SERVER_ERROR",
  errors?: unknown,
): Response => {
  const response: ApiResponse = {
    success: false,
    message,
    code,
  };

  if (errors !== undefined) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};
