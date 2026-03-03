import { Response } from "express";

/**
 * Standardized API response utilities
 */
export class ApiResponse {
  /**
   * Success response
   */
  static success(res: Response, data: any, statusCode: number = 200) {
    return res.status(statusCode).json({
      success: true,
      data,
    });
  }

  /**
   * Paginated response
   */
  static paginated(
    res: Response,
    data: any[],
    options: {
      limit: number;
      offset: number;
      total?: number;
    }
  ) {
    const { limit, offset, total } = options;
    const hasMore = data.length === limit;

    return res.json({
      success: true,
      data,
      pagination: {
        limit,
        offset,
        count: data.length,
        hasMore,
        nextOffset: hasMore ? offset + data.length : null,
        ...(total !== undefined && { total }),
      },
    });
  }

  /**
   * Error response
   */
  static error(res: Response, message: string, statusCode: number = 500) {
    return res.status(statusCode).json({
      success: false,
      error: message,
    });
  }

  /**
   * Created response (201)
   */
  static created(res: Response, data: any) {
    return res.status(201).json({
      success: true,
      data,
    });
  }

  /**
   * No content response (204)
   */
  static noContent(res: Response) {
    return res.status(204).send();
  }
}
