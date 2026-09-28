import { NextFunction, Request, Response } from "express";
import { z } from "zod";

const validateRequest = <T extends z.ZodObject<any>>(schema: T) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = await schema.parseAsync({
        body: req.body,
        cookies: req.cookies,
        headers: req.headers,
        params: req.params,
        query: req.query,
      });

      req.body = validatedData.body;

      next();
    } catch (error) {
      res.status(400).json({
        success: false,
        message: "Validation error",
        error,
      });
    }
  };
};

export default validateRequest;
