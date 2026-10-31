import { Request, Response, NextFunction } from "express";
import { ZodTypeAny } from "zod";

export const validate = (schema: ZodTypeAny) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = (await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      })) as { body?: unknown; query?: unknown; params?: unknown };

      if (parsed.body !== undefined) {
        req.body = parsed.body;
      }
      if (parsed.query !== undefined) {
        req.query = parsed.query as Request["query"];
      }
      if (parsed.params !== undefined) {
        req.params = parsed.params as Record<string, string>;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
