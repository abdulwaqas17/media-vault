import xss from "xss";

/**
 * Sanitize a string by escaping HTML characters and removing XSS vectors
 */
export const SanitizeString = (input) => {
  if (typeof input !== "string") return input;
  return xss(input.trim());
};

/**
 * Recursively sanitize all string fields in an object
 */
export const SanitizeObject = (obj) => {
  if (!obj || typeof obj !== "object") return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => {
      if (typeof item === "string") {
        return SanitizeString(item);
      }

      return SanitizeObject(item);
    });
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      sanitized[key] = SanitizeString(value);
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = SanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};


// We are using Per-route schema based Validation and Sanitiation, so do not need this Golbal Middleware
/**
 * Middleware to sanitize request body, query, and params
 */
// export const SanitizeRequest = () => {
//   return (req, res, next) => {
//     if (req.body) req.body = SanitizeObject(req.body);
//     if (req.query) req.query = SanitizeObject(req.query);
//     if (req.params) req.params = SanitizeObject(req.params);
//     next();
//   };
// };
