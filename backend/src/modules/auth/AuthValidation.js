import Joi from "joi";

/**
 * Joi schema to validate signup request body
 */
export const SignupSchema = Joi.object({
  full_name: Joi.string()
    .min(3)
    .max(30)
    .required()
    .messages({
      "any.required": "Full name is required",
      "string.empty": "Full name is required",
      "string.min": "Full name should have at least 3 characters",
      "string.max": "Full name should have maximum 30 characters",
    }),

  email: Joi.string()
    .email()
    .required()
    .messages({
      "any.required": "Email is required",
      "string.empty": "Email is required",
      "string.email": "Email must be valid",
    }),

  password: Joi.string()
    .min(6)
    .required()
    .messages({
      "any.required": "Password is required",
      "string.empty": "Password is required",
      "string.min": "Password should be at least 6 characters",
    }),
});

/**
 * Joi schema to validate signup/login request body
 */
export const GoogleAuthSchema = Joi.object({
  idToken: Joi.string().required().messages({
    "string.empty": "Google idToken is required",
    "any.required": "Google idToken is required",
  }),
});


/**
 * Login request validation schema
 */
export const LoginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "any.required": "Email is required",
    "string.empty": "Email is required",
    "string.email": "Email must be valid",
  }),

  password: Joi.string().min(6).required().messages({
    "any.required": "Password is required",
    "string.empty": "Password is required",
    "string.min": "Password should be at least 6 characters",
  }),
});