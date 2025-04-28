import Config from "../config/config";
import axios from "axios";
import { rest_authenticate } from "../utils/auth";
import 'dotenv/config';
import fs from 'fs';
import path from 'path';


const conf = new Config();

interface AuthConfig {
  id: string;
  password: string;
  api_key: string;
  vendor_key: string;
  imei: string;
  topt: string;
}

interface StockListParams {
  query: string;
  exchange: string; // Can be 'NSE', 'BSE', 'NFO', 'ALL'
}

interface StockListResponse {
  [key: string]: any;
}

const getStockList = async ({
  query,
  exchange,
  limit = 100,
  offset = 0
}: StockListParams & { limit?: number; offset?: number }): Promise<StockListResponse> => {

  const config: AuthConfig = {
    id: process.env.ID || "",
    password: process.env.PASSWORD || "",
    api_key: process.env.API_KEY || "",
    vendor_key: process.env.VENDOR_KEY || "",
    imei: process.env.IMEI || "",
    topt: process.env.TOTP || "",
  };

  try {
    const filePath = path.resolve(__dirname, '../../merged_instruments.json');
    if (!fs.existsSync(filePath)) {
      return { stat: "Not_Ok", emsg: "Instruments file not found" };
    }

    const fileContent = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileContent);

    const normalizedQuery = query.toUpperCase().trim();

    // Determine which exchanges to search
    let exchangesToSearch: string[];
    if (exchange.toUpperCase() === 'ALL') {
      // Search all available exchanges
      exchangesToSearch = Object.keys(data);
    } else {
      // Search only the specified exchange
      exchangesToSearch = [exchange.toUpperCase()];
    }

    let allResults: any[] = [];

    // Search across all specified exchanges
    for (const exch of exchangesToSearch) {
      const exchangeInstruments = data[exch] || [];

      const results = exchangeInstruments.filter((instrument: any) => {
        return (
          (instrument.Symbol && instrument.Symbol.toUpperCase().includes(normalizedQuery)) ||
          (instrument.TradingSymbol && instrument.TradingSymbol.toUpperCase().includes(normalizedQuery))
        );
      });

      // Add exchange info to results
      allResults = [...allResults, ...results];
    }

    if (allResults.length > 0) {
      const slicedResults = allResults.slice(offset, offset + limit);
      return {
        stat: "Ok",
        values: slicedResults,
        total: allResults.length,
        limit,
        offset,
        request_time: new Date().toISOString()
      };
    } else {
      const token = await rest_authenticate(config);
      if (token.length === 0) {
        return { status: "failed", message: "Token generation issue" };
      }

      const values: Record<string, string> = {
        uid: config.id,
        stext: query,
        exch: exchange,
      };

      let payload = "jData=" + JSON.stringify(values) + `&jKey=${token}`;
      const stockListResponse = await axios.post(conf.StockList_URL, payload);

      if (stockListResponse.data["stat"] === "Ok") {
        const data = stockListResponse.data;
        console.log(data, "stockList");
        return data;
      } else {
        return stockListResponse.data;
      }
    }
  } catch (error: any) {
    console.error("Search error:", error);
    return {
      stat: "Not_Ok",
      emsg: `Search error: ${error.message}`,
      request_time: new Date().toISOString()
    };
  }
};

interface QuotesParams {
  exch: string;
  token: string;
}

interface QuotesResponse {
  [key: string]: any;
}

const getQuotes = async (params: QuotesParams): Promise<QuotesResponse> => {
  const config: AuthConfig = {
    id: process.env.ID || "",
    password: process.env.PASSWORD || "",
    api_key: process.env.API_KEY || "",
    vendor_key: process.env.VENDOR_KEY || "",
    imei: process.env.IMEI || "",
    topt: process.env.TOTP || "",
  };

  console.log('getQuotes function called with params:', params);

  // Function to make the actual request
  const makeRequest = async (authToken: string): Promise<QuotesResponse> => {

    const values: Record<string, string> = {
      uid: config.id
    };

    if (params.exch) values.exch = params.exch;
    if (params.token) values.token = params.token;

    let payload = 'jData=' + JSON.stringify(values);
    payload = payload + `&jKey=${authToken}`;

    console.log('Getting quotes with payload (sensitive data masked):', {
      ...values,
      // Not showing the token for security
    });

    try {
      const quotesResponse = await axios.post(conf.GET_QUOTES_URL, payload);
      console.log('Quotes response status:', quotesResponse.status);
      return quotesResponse.data;
    } catch (error: any) {
      console.error('Error in API request:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
        return error.response.data || {
          stat: "Not_Ok",
          message: error.message,
          error: "API request failed"
        };
      }
      throw error;
    }
  };

  try {
    // First attempt with initial authentication
    console.log('Authenticating...');
    let token = await rest_authenticate(config);

    if (!token || token.length === 0) {
      console.error('Authentication failed: Empty token');
      return {
        stat: "Not_Ok",
        message: "Authentication failed: Unable to generate token"
      };
    }

    console.log('Authentication successful, token length:', token.length);

    // First attempt
    let response = await makeRequest(token);

    return response;

  } catch (error: any) {
    console.error('Error getting quotes:', error);
    return {
      stat: "Not_Ok",
      message: `Error fetching quotes: ${error.message}`,
      error: error.response ? error.response.data : null
    };
  }
};


export { getStockList, getQuotes };