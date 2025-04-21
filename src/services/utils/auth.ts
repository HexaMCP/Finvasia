import axios from "axios";
import sha256 from "crypto-js/sha256";
import speakeasy from "speakeasy";
import Config from "../config/config"; // Adjust the import path as necessary

const conf = new Config();

let globalToken: string | null = null; // Store the token globally
let tokenExpiry: Date | null = null; // Store token expiry time

// Define the type for the configuration object
interface AuthConfig {
  id: string;
  api_key: string;
  password: string;
  topt: string;
  vendor_key: string;
  imei: string;
}

// Function to authenticate and retrieve a token
const rest_authenticate = async (config: AuthConfig): Promise<string> => {
  try {
    //Check if the token is still valid
    if (globalToken && tokenExpiry && new Date() < tokenExpiry) {
      return globalToken;
    }

    const pwd = sha256(config.password).toString();
    const u_app_key = `${config.id}|${config.api_key}`;
    const app_key = sha256(u_app_key).toString();
    const otp = speakeasy.totp({
      secret: config.topt,
      encoding: "base32",
    });

    const authparams = {
      source: "API",
      apkversion: "js:1.0.0",
      uid: config.id,
      pwd: pwd,
      factor2: otp,
      vc: config.vendor_key,
      appkey: app_key,
      imei: config.imei,
    };

    const payload = "jData=" + JSON.stringify(authparams) + "&jKey=";

    const response = await axios.post(conf.LOGIN_URL, payload);
    const data: string = response.data.susertoken;

    if (data) {
      globalToken = data; // Store the token globally
      tokenExpiry = new Date(new Date().getTime() + 15 * 60 * 1000); // Set expiry to 15 minutes
    }
    return data;
  } catch (err: any) {
    console.error("Error in authentication:", err);
    return "";
  }
};

export { rest_authenticate };