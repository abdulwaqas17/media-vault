import Joi from "joi";
import { ImageType } from "../../constants/constants.js";

const allowedAssetTypes = Object.values(ImageType);
/**
 * Validate presigned url schema
 */
export const PresignedUrlSchema = Joi.object({
    asset_type: Joi.string()
      .valid(...allowedAssetTypes)
      .required()
      .messages({
        "any.only": `asset_type must be one of the following: ${allowedAssetTypes.join(", ")}`,
        "any.required": "asset_type is a required field",
        "string.empty": "asset_type cannot be an empty field"
      }),
    file_name: Joi.string()
      .required()
      .messages({
        "any.required": "file_name is a required field",
        "string.empty": "file_name cannot be an empty field"
      }),
    mime_type: Joi.string()
      .required()
      .messages({
        "any.required": "mime_type is a required field",
        "string.empty": "mime_type cannot be an empty field"
      })
  });

/**
 * Validate update profile schema
 */
export const UpdateProfileSchema = Joi.object({
  user_id: Joi.string().optional(),
  full_name: Joi.string().required().messages({
    "any.required": "full_name is required",
    "string.empty": "full_name cannot be an empty field"
  }),
  designation: Joi.string().required().messages({
    "any.required": "designation is required",
    "string.empty": "designation cannot be an empty field"
  }),
  contact_number: Joi.string().required().messages({
    "any.required": "contact_number is required",
    "string.empty": "contact_number cannot be an empty field"
  }),
  connect_me_for: Joi.string().required().messages({
    "any.required": "connect_me_for is required",
    "string.empty": "connect_me_for cannot be an empty field"
  }),
  company_name: Joi.string().required().messages({
    "any.required": "company_name is required",
    "string.empty": "company_name cannot be an empty field"
  }),
  password: Joi.string().min(6).max(50).optional().messages({
    "string.min": "password must be at least 6 characters long",
    "string.max": "password cannot exceed 50 characters"
  }),
  media_assets: Joi.array().items(
    Joi.object({
      asset_type: Joi.string().valid(...allowedAssetTypes).required(),
      s3_key: Joi.string().required(),
      cdn_url: Joi.string().required(),
      mime_type: Joi.string().required(),
    })
  ).optional()
});
