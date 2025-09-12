import type { Request, Response, NextFunction } from "express";
import Joi from "joi";

type requestType = "body" | "query" | "params";
export const MValidate = (schema: Joi.ObjectSchema, property: requestType = "body") => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const { error } = schema.validate(req[property], { 
            abortEarly: false,
            allowUnknown: false
        });

        if (error) {
            const validationError = error.details.map((detail) => {
                return Error(detail.message);
            })[0];

            return next(validationError);
        }

        

        next();
    };
};