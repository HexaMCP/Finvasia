import Config from "../config/config";
import axios from "axios";
import { rest_authenticate } from "../utils/auth";

const conf = new Config();


interface AuthConfig {
  id: string;
  password: string;
  api_key: string;
  vendor_key: string;
  imei: string;
  topt: string;
}

interface BalanceResponse {
  [key: string]: any;
  INR?: string;
  cash?: string;
}

const checkBalance = async (): Promise<BalanceResponse | string> => {
  console.log("getbalance");

  const config: AuthConfig = {
    id: process.env.ID || "",
    password: process.env.PASSWORD || "",
    api_key: process.env.API_KEY || "",
    vendor_key: process.env.VENDOR_KEY || "",
    imei: process.env.IMEI || "",
    topt: process.env.TOTP || "",
  };

  try {
    console.log(config, "CHECK CONFIG");
    const token = await rest_authenticate(config); // Use global authenticate function

    if (token.length === 0) {
      console.log("Token is empty");
      return "Token generation issue";
    }

    const values: Record<string, string> = {
      uid: config.id,
      actid: config.id,
    };

    const product_type = "";
    const segment = "";
    const exchange = "";

    if (product_type) values["prd"] = product_type;
    if (segment) values["seg"] = segment;
    if (exchange) values["exch"] = exchange;

    let payload = "jData=" + JSON.stringify(values);
    payload = payload + `&jKey=${token}`;

    const balance_res = await axios.post(conf.LIMITS_URL, payload);

    if (balance_res.data["stat"] === "Ok") {
      const data = balance_res.data;
      data["INR"] = data["cash"];
      return data;
    } else {
      return "Balance not available";
    }
  } catch (error: any) {
    console.error("Error fetching balance:", error);
    return "An error occurred while fetching balance.";
  }
};

export { checkBalance };