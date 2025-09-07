import { env } from "process";


const config = {
  env: env.NODE_ENV || "development",
  isDevelopment: () => config.env === "development",
  isProduction: () => config.env === "production",
};


export default config;