import { NextFunction, Request, Response } from "express";
import { upload } from "@/middlewares/multer.middleware";
import { body } from "express-validator";

export const parseUpdateFields = [
  upload.single("thumbnail"),
  body("name").optional(),
  body("description").optional(),
  (
    req: Request<{}, {}, { name?: string; description?: string }>,
    res: Response,
    next: NextFunction
  ) => {
    // If content-type is JSON, parse body normally
    if (req.headers["content-type"]?.includes("application/json")) {
      return next();
    }

    // For form-data, ensure fields are strings (no JSON parsing needed)
    if (req.body.name && typeof req.body.name !== "string") {
      req.body.name = String(req.body.name);
    }
    if (req.body.description && typeof req.body.description !== "string") {
      req.body.description = String(req.body.description);
    }

    next();
  },
];
