import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

export interface RequestValidationSchema {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

export const validateRequest = (schema: RequestValidationSchema) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (schema.params) {
        req.params = (await schema.params.parseAsync(req.params)) as Record<string, string>;
      }
      if (schema.query) {
        req.query = (await schema.query.parseAsync(req.query)) as Request["query"];
      }
      if (schema.body) {
        req.body = await schema.body.parseAsync(req.body);
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};

export const validate = (schema: ZodSchema) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      if (parsed && typeof parsed === "object") {
        const requestParts = parsed as {
          body?: unknown;
          query?: unknown;
          params?: unknown;
        };

        if (requestParts.body !== undefined) {
          req.body = requestParts.body;
        }
        if (requestParts.query !== undefined) {
          req.query = requestParts.query as Request["query"];
        }
        if (requestParts.params !== undefined) {
          req.params = requestParts.params as Record<string, string>;
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
