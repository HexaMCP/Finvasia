import { rest_authenticate } from "../utils/auth";
import Config from "../config/config";
import axios from "axios";
import 'dotenv/config';


const conf = new Config();

interface AuthConfig {
  id: string;
  password: string;
  api_key: string;
  vendor_key: string;
  imei: string;
  topt: string;
}

interface WatchlistResponse {
  [key: string]: any;
  values?: string[];
  wlname?: string;
}

const getWatchlist = async (): Promise<WatchlistResponse | string> => {
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
      console.log("Token is empty");
      return "Token generation issue";
    }

    const values: Record<string, string> = { uid: config.id };
    let payload = "jData=" + JSON.stringify(values) + `&jKey=${token}`;
    const watchlist = await axios.post(conf.WATCHLIST_URL, payload);

    if (watchlist.data["stat"] === "Ok") {
      let data = watchlist.data;

      console.log(watchlist, "data");
      if (!watchlist.data["values"] || watchlist.data["values"].length === 0) {
        return "No watchlist found";
      } else {
        values["uid"] = config.id;
        values["wlname"] = watchlist.data["values"][0];
        payload = "jData=" + JSON.stringify(values) + `&jKey=${token}`;
        const MarketWatch = await axios.post(conf.marketWatch_URL, payload);

        if (MarketWatch.data["stat"] === "Ok") {
          data = MarketWatch.data;
          console.log(MarketWatch, "MarketWatch");
        } else {
          return "No watchlist found";
        }
        return data;
      }
    } else {
      return "No watchlist found";
    }
  } catch (error: any) {
    console.error("Error fetching watchlist:", error);
    return "An error occurred while fetching the watchlist.";
  }
};

// getWatchlist();

export { getWatchlist };