// This file sets or extracts all the config values that the application requires
// It acts as an interface between env variables and the values that the code uses
// process.env + other config values -> config -> source code 


// enforces some config values to exist
function requiredEnv (name) {
  const value = process.env[name];

  if(!value || value.trim() === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}


const NODE_ENV = process.env.NODE_ENV || "development";
const MONGO_URL = requiredEnv("MONGO_URL");
const PORT = Number(process.env.PORT) || 8000;

const JWT_SECRET = requiredEnv("JWT_SECRET");

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
const JWT_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; 

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax",
  secure: NODE_ENV === "production",
  maxAge: JWT_COOKIE_MAX_AGE,
};

module.exports = {
  NODE_ENV,
  PORT,
  MONGO_URL,

  JWT_SECRET,
  JWT_EXPIRES_IN,

  COOKIE_OPTIONS,
};