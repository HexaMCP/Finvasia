import Config from "../config/config";
import axios from "axios";
import { rest_authenticate } from "../utils/auth"; // Adjust the import path as necessary

const conf = new Config();

interface AuthConfig {
  id: string;
  password: string;
  api_key: string;
  vendor_key: string;
  imei: string;
  topt: string;
}

// Function to fetch user details
const getProfile = async (): Promise<any> => {
  const config: AuthConfig = {
    id: process.env.ID || "",
    password: process.env.PASSWORD || "",
    api_key: process.env.API_KEY || "",
    vendor_key: process.env.VENDOR_KEY || "",
    imei: process.env.IMEI || "",
    topt: process.env.TOTP || "",
  };

  try {
    const token = await rest_authenticate(config);

    if (token.length === 0) {
      console.error("Token is empty");
      return "Token generation issue";
    }

    const values = { uid: config.id };
    let payload = "jData=" + JSON.stringify(values) + `&jKey=${token}`;
    const user = await axios.post(conf.UserDetails_URL, payload);

    if (user.data["stat"] === "Ok") {
      const data = user.data;
      console.log(data, "user");
      return data;
    } else {
      return "User Details not available";
    }
  } catch (error: any) {
    console.error("Error fetching user details:", error);
    return "An error occurred while fetching user details.";
  }
};

export { getProfile };