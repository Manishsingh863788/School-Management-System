import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any[];
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    [key: string]: any;
  };
}

export const sendSuccess = <T>(
  res: Response,
  message: string,
  data?: T,
  statusCode = 200,
  meta?: ApiResponse['meta']
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    message,
    ...(data !== undefined ? { data } : {}),
    ...(meta ? { meta } : {}),
  };
  return res.status(statusCode).json(response);
};

export const sendError = (
  res: Response,
  message: string,
  statusCode = 400,
  errors: any[] = []
): Response => {
  const response: ApiResponse = {
    success: false,
    message,
    errors,
  };
  return res.status(statusCode).json(response);
};
