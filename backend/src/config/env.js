import dotenv from "dotenv";

// Load .env.test file
dotenv.config({ path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env', override: true  });

console.log("Load .env file ==========>",process.env.NODE_ENV);
console.log("Load ===========>",process.env.DATABASE_URL);


 const env = {
  PORT: process.env.PORT || 5000,
  DATABASE_URL: process.env.DATABASE_URL,

  JWT_SECRET: process.env.JWT_SECRET,
  ACCESS_TOKEN_EXPIRES_IN: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m",
  REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",

  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:3000",

  S3_BUCKET_NAME: process.env.S3_BUCKET_NAME,
  AWS_REGION: process.env.AWS_REGION,
  CDN_URL: process.env.CDN_URL,
  CLOUDFRONT_DISTRIBUTION_ID: process.env.CLOUDFRONT_DISTRIBUTION_ID,
  USE_CDN: process.env.USE_CDN,

  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,

  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,


};

export default env;