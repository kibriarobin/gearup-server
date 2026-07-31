import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

export default {
  PORT: process.env.PORT!,
  DATABASE_URL: process.env.DATABASE_URL!,
  APP_URL: process.env.APP_URL!,
  FRONTEND_URL: process.env.FRONTEND_URL!,
  BCRYPT_SALT_ROUNDS: process.env.BCRYPT_SALT_ROUNDS!,
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET!,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET!,
  JWT_ACCESS_EXPIRATION: process.env.JWT_ACCESS_EXPIRATION!,
  JWT_REFRESH_EXPIRATION: process.env.JWT_REFRESH_EXPIRATION!,
  NODE_ENV: process.env.NODE_ENV!,
  SSL_COMMERZ_STORE_ID: process.env.SSL_COMMERZ_STORE_ID!,
  SSL_COMMERZ_STORE_PASSWORD: process.env.SSL_COMMERZ_STORE_PASSWORD!,
  SSLCOMMERZ_IS_LIVE: process.env.SSLCOMMERZ_IS_LIVE=== "true",
  SSLCOMMERZ_SUCCESS_URL: process.env.SSLCOMMERZ_SUCCESS_URL!,
  SSLCOMMERZ_FAIL_URL: process.env.SSLCOMMERZ_FAIL_URL!,
  SSLCOMMERZ_CANCEL_URL: process.env.SSLCOMMERZ_CANCEL_URL!,
};
