import { ApiError } from "../utils/ApiError.js";
import { SanitizeObject } from "../utils/sanitizer.js";

/**
 * Middleware to validate AND sanitize request data using Joi schemas
 * Validation happens first, then sanitization
 */
export const ValidateAndSanitize = (schema, property = "body") => {
  return (req, res, next) => {
    // Step 1: Validate first
    const validationResult = schema.validate(req[property], {
      abortEarly: false, // show all validation errors, not just the first one
      stripUnknown: true, // remove unknown fields that are not defined in the schema
    });
    
    const { error, value } = validationResult;

    if (error) {
      return next(new ApiError(400, error.details[0].message));
    }

    // Step 2: Sanitize the validated data
    const sanitizedData = SanitizeObject(value);

    // Step 3: Replace request property with sanitized data
    req[property] = sanitizedData;
    
    next();
  };
};