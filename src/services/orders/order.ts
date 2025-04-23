import Config from '../config/config';
import axios from 'axios';
import { rest_authenticate } from '../utils/auth';
import 'dotenv/config';


interface ConfigType {
  id: string;
  password: string;
  api_key: string;
  vendor_key: string;
  imei: string;
  topt: string;
}

interface OrderPayload {
  uid?: string;
  actid?: string;
  message?: string;
  [key: string]: any;
}

interface CancelOrderParams {
  norenordno: string;
}

interface CheckOrderStatusParams {
  norenordno: string;
  exch: string;
}

const conf = new Config();

export const placeOrder = async (orderPayload: OrderPayload): Promise<any> => {
  const config: ConfigType = {
    id: process.env.ID || '',
    password: process.env.PASSWORD || '',
    api_key: process.env.API_KEY || '',
    vendor_key: process.env.VENDOR_KEY || '',
    imei: process.env.IMEI || '',
    topt: process.env.TOTP || '',
  };

  try {
    const token = await rest_authenticate(config);
    if (!token) {
      return "Token generation issue";
    }

    orderPayload.uid = config.id;
    orderPayload.actid = config.id;

    const payload = "jData=" + JSON.stringify(orderPayload) + `&jKey=${token}`;
    const orderResponse = await axios.post(conf.placeOrder_URL, payload);
    return orderResponse.data;
  } catch (error: any) {
    console.error(error);
    return error.response?.data?.emsg || error.message || "An error occurred while placing the order.";
  }
};

export const cancelOrder = async ({ norenordno }: CancelOrderParams): Promise<any> => {
  const config: ConfigType = {
    id: process.env.ID || '',
    password: process.env.PASSWORD || '',
    api_key: process.env.API_KEY || '',
    vendor_key: process.env.VENDOR_KEY || '',
    imei: process.env.IMEI || '',
    topt: process.env.TOTP || '',
  };

  try {
    const token = await rest_authenticate(config);
    if (!token) {
      return "Token generation issue";
    }

    const cancelPayload = {
      norenordno,
      uid: config.id,
    };

    const payload = "jData=" + JSON.stringify(cancelPayload) + `&jKey=${token}`;
    const response = await axios.post(`${conf.BASE_URL}/CancelOrder`, payload);

    return response.data;
  } catch (error: any) {
    console.error("Error in cancelOrder:", error);
    return { error: error.message || "Unknown error" };
  }
};

export const checkOrderStatus = async (params: CheckOrderStatusParams): Promise<any> => {
  // console.log('checkOrderStatus');
  const config: ConfigType = {
    id: process.env.ID || '',
    password: process.env.PASSWORD || '',
    api_key: process.env.API_KEY || '',
    vendor_key: process.env.VENDOR_KEY || '',
    imei: process.env.IMEI || '',
    topt: process.env.TOTP || '',
  };

  try {
    console.log(config, 'CHECK CONFIG');
    const token = await rest_authenticate(config);

    if (!token) {
      console.log('Token is empty');
      if (!token) {
        console.log('Token is empty');
        return { status: "failed", message: "Token generation issue" }; // <- return an object here!
      }
    }

    const values = {
      uid: config.id,
      norenordno: params.norenordno,
      actid: config.id,
      exch: params.exch,
    };


    // return values;

    let payload = 'jData=' + JSON.stringify(values) + `&jKey=${token}`;

    console.log('Checking order status with payload:', values);
    const statusResponse = await axios.post(conf.SINGLE_ORDER_STATUS_URL, payload);
    console.log('Order status response:', statusResponse.data);

    return statusResponse.data;
  } catch (error: any) {
    console.error('Error checking order status:', error);
    return {
      status: "failed",
      message: error.message,
      error: error.response ? error.response.data : null,
    };
  }
};

interface PositionParams {
  actid?: string;
}

interface Position {
  [key: string]: any;
}

interface PositionsResponse {
  [key: string]: any;
}

export const getPositions = async (params: PositionParams = {}): Promise<Position[] | PositionsResponse> => {
  console.log('Fetching positions book');
  const config: ConfigType = {
    id: process.env.ID || "",
    password: process.env.PASSWORD || "",
    api_key: process.env.API_KEY || "",
    vendor_key: process.env.VENDOR_KEY || "",
    imei: process.env.IMEI || "",
    topt: process.env.TOTP || "",
  };

  try {
    const token = await rest_authenticate(config);

    if (!token || token.length === 0) {
      return { status: "failed", message: "Token generation issue" };
    }

    const values: Record<string, string> = {
      uid: config.id
    };

    if (params.actid) values.actid = params.actid;

    let payload = 'jData=' + JSON.stringify(values);
    payload = payload + `&jKey=${token}`;

    console.log('Getting positions with payload (sensitive data masked):', { ...values });
    const positionsResponse = await axios.post(conf.POSITIONS_URL, payload);
    console.log('Positions response received');

    return positionsResponse.data;
  } catch (error: any) {
    console.error('Error getting positions:', error);
    return {
      status: "failed",
      message: error.message,
      error: error.response ? error.response.data : null
    };
  }
};

interface HoldingsParams {
  actid?: string;
  prd?: string;
}

interface HoldingsResponse {
  [key: string]: any;
}

export const getHoldings = async (params: HoldingsParams = {}): Promise<HoldingsResponse | { status: string, message: string, error?: any }> => {
  console.log('Fetching holdings');

  const config: ConfigType = {
    id: process.env.ID || "",
    password: process.env.PASSWORD || "",
    api_key: process.env.API_KEY || "",
    vendor_key: process.env.VENDOR_KEY || "",
    imei: process.env.IMEI || "",
    topt: process.env.TOTP || "",
  };

  try {
    // Authenticate first to get the token
    const token = await rest_authenticate(config);

    if (!token || token.length === 0) {
      console.log('Token is empty');
      return { status: "failed", message: "Token generation issue" };
    }

    // Prepare holdings request parameters
    const values: Record<string, string> = {
      uid: config.id
    };

    // Add optional parameters if provided
    if (params.actid) values.actid = params.actid;
    if (params.prd) values.prd = params.prd;

    let payload = 'jData=' + JSON.stringify(values);
    payload = payload + `&jKey=${token}`;

    console.log('Getting holdings with payload:', values);
    const holdingsResponse = await axios.post(conf.HOLDINGS_URL, payload);
    console.log('Holdings response received');

    return holdingsResponse.data;
  } catch (error: any) {
    console.error('Error getting holdings:', error);
    return {
      status: "failed",
      message: error.message,
      error: error.response ? error.response.data : null
    };
  }
};


interface OrderMarginParams {
  actid?: string;       // Account ID (optional)
  exch: string;         // Exchange
  tsym: string;         // Trading symbol
  qty: string | number; // Quantity
  prc: string | number; // Price
  prd: string;          // Product
  trantype: string;     // Transaction type (B/S)
  prctyp: string;       // Price type
  trgprc?: string | number; // Trigger price (optional)
  blprc?: string | number;  // Book loss price (optional)
  fillshares?: string | number; // Filled shares (optional)
  rorgprc?: string | number;   // Original price (optional)
  orgtrgprc?: string | number; // Original trigger price (optional)
  norenordno?: string;  // Noren order number (optional)
  snonum?: string;      // SNO Number (optional)
}

interface OrderMarginResponse {
  [key: string]: any;
}

export const getOrderMargin = async (params: OrderMarginParams): Promise<OrderMarginResponse> => {
  // Get credentials from environment variables
  const config: ConfigType = {
    id: process.env.ID || "",
    password: process.env.PASSWORD || "",
    api_key: process.env.API_KEY || "",
    vendor_key: process.env.VENDOR_KEY || "",
    imei: process.env.IMEI || "",
    topt: process.env.TOTP || "",
  };

  console.log('Calculating order margin with params:', {
    ...params,
    // Hide sensitive fields for logging
  });

  try {
    // Authenticate first to get the token
    const token = await rest_authenticate(config);

    if (!token || token.length === 0) {
      console.log('Token is empty');
      return {
        stat: "Not_Ok",
        message: "Token generation issue"
      };
    }

    // Required parameters for order margin calculation - convert all to strings
    const orderParams: Record<string, string> = {
      uid: config.id,
      actid: config.id,
      exch: String(params.exch),
      tsym: String(params.tsym),
      qty: String(params.qty),
      prc: String(params.prc),
      prd: String(params.prd),
      trantype: String(params.trantype),
      prctyp: String(params.prctyp)
    };

    // Add optional parameters if they exist (also as strings)
    if (params.trgprc !== undefined) orderParams.trgprc = String(params.trgprc);
    if (params.blprc !== undefined) orderParams.blprc = String(params.blprc);
    if (params.fillshares !== undefined) orderParams.fillshares = String(params.fillshares);
    if (params.rorgprc !== undefined) orderParams.rorgprc = String(params.rorgprc);
    if (params.orgtrgprc !== undefined) orderParams.orgtrgprc = String(params.orgtrgprc);
    if (params.norenordno !== undefined) orderParams.norenordno = String(params.norenordno);
    if (params.snonum !== undefined) orderParams.snonum = String(params.snonum);

    // Construct the payload
    let payload = 'jData=' + JSON.stringify(orderParams);
    payload = payload + `&jKey=${token}`;

    console.log('Requesting order margin with params:', {
      ...orderParams,
      // Not showing sensitive data
    });

    const margin_response = await axios.post(conf.ORDER_MARGIN_URL, payload);
    console.log('Order margin response received');

    if(margin_response.data.stat === "Ok") {
      margin_response.data["available_cash"] = margin_response.data.cash;
      delete margin_response.data.cash;
      delete margin_response.data.ordermargin
    }

    return margin_response.data;
  } catch (error: any) {
    console.error('Error calculating order margin:', error);
    return {
      stat: "Not_Ok",
      message: error.message,
      error: error.response ? error.response.data : null
    };
  }
};

interface OrderBookParams {
  prd?: string;
}

interface OrderBookResponse {
  [key: string]: any;
}

export const getOrderBook = async (params: OrderBookParams = {}): Promise<OrderBookResponse> => {
  console.log('Fetching order book');

  // Get credentials from environment variables
  const config: ConfigType = {
    id: process.env.ID || "",
    password: process.env.PASSWORD || "",
    api_key: process.env.API_KEY || "",
    vendor_key: process.env.VENDOR_KEY || "",
    imei: process.env.IMEI || "",
    topt: process.env.TOTP || "",
  };

  try {
    // Authenticate first to get the token
    const token = await rest_authenticate(config);

    if (!token || token.length === 0) {
      console.log('Token is empty');
      return {
        stat: "Not_Ok",
        message: "Token generation issue"
      };
    }

    // Required parameters for order book - all as strings
    const orderBookParams: Record<string, string> = {
      uid: String(config.id)
    };

    // Add optional product filter if provided
    if (params.prd !== undefined) {
      orderBookParams.prd = String(params.prd);
    }

    // Construct the payload
    let payload = 'jData=' + JSON.stringify(orderBookParams);
    payload = payload + `&jKey=${token}`;

    console.log('Requesting order book with params:', orderBookParams);
    const orderbook_response = await axios.post(conf.ORDER_BOOK_URL, payload);
    console.log('Order book response received');

    return orderbook_response.data;
  } catch (error: any) {
    console.error('Error fetching order book:', error);
    return {
      stat: "Not_Ok",
      request_time: new Date().toISOString(),
      emsg: error.message,
      error_details: error.response ? error.response.data : null
    };
  }
};

interface TradeBookParams {
  actid?: string;  
}

interface TradeBookResponse {
  stat: string;
  [key: string]: any;
}

// Function to fetch the trade book

export const getTradeBook = async (): Promise<TradeBookResponse> => {
  console.log('Fetching trade book');

  const config: ConfigType = {
    id: process.env.ID || "",
    password: process.env.PASSWORD || "",
    api_key: process.env.API_KEY || "",
    vendor_key: process.env.VENDOR_KEY || "",
    imei: process.env.IMEI || "",
    topt: process.env.TOTP || "",
  };

  try {
    const token = await rest_authenticate(config);

    if (!token || token.length === 0) {
      console.log('Token is empty');
      return {
        stat: "Not_Ok",
        message: "Token generation issue"
      };
    }

    const tradeBookParams = {
      uid: config.id,
      actid: config.id 
    };

    let payload = 'jData=' + JSON.stringify(tradeBookParams);
    payload = payload + `&jKey=${token}`;

    console.log('Requesting trade book with params:', {
      actid: tradeBookParams.actid
    });
    const tradeBookResponse = await axios.post(conf.TRADE_BOOK_URL, payload);
    console.log('Trade book response received');

    return tradeBookResponse.data;
  } catch (error: any) {
    console.error('Error fetching trade book:', error);
    return {
      stat: "Not_Ok",
      request_time: new Date().toISOString(),
      emsg: error.message || "An error occurred while fetching trade book",
      error_details: error.response ? error.response.data : null
    };
  }
};


// Interface for Modify Order payload
interface ModifyPayload {
  uid?: string;                // User ID
  exch: string;                // Exchange
  norenordno: string;          // Noren order number to modify
  prctyp?: string;             // Price type (LMT/MKT/SL-MKT/SL-LMT)
  prc?: string | number;       // Modified price
  qty?: string | number;       // Modified quantity
  tsym: string;                // Trading symbol (must be the same as original order)
  ret?: string;                // Retention type (DAY/IOC/EOS)
  trgprc?: string | number;    // Trigger price for SL-MKT or SL-LMT
  bpprc?: string | number;     // Book profit price (for Bracket orders)
  blprc?: string | number;     // Book loss price (for High Leverage and Bracket orders)
  trailprc?: string | number;  // Trailing price (for High Leverage and Bracket orders)
}

// Interface for Modify Order response
interface ModifyOrderResponse {
  stat: string;        // Ok or Not_Ok
  result?: string;     // Noren Order number if successful
  request_time?: string;
  emsg?: string;       // Error message if modification fails
  [key: string]: any;
}

// Function to modify an order
export const modifyOrder = async (params: ModifyPayload): Promise<ModifyOrderResponse> => {
  console.log('Modifying order');
  
  const conf = new Config();
  const config: ConfigType = {
    id: process.env.ID || '',
    password: process.env.PASSWORD || '',
    api_key: process.env.API_KEY || '',
    vendor_key: process.env.VENDOR_KEY || '',
    imei: process.env.IMEI || '',
    topt: process.env.TOTP || '',
  };

  try {
    const token = await rest_authenticate(config);
    if (!token) {
      return {
        stat: "Not_Ok",
        emsg: "Token generation issue"
      };
    }

    // Add user ID to the params
    params.uid = config.id;

    // Construct the payload
    const payload = "jData=" + JSON.stringify(params) + `&jKey=${token}`;
    
    console.log('Modifying order with params:', {
      ...params,
      // Hide sensitive data in logs
    });
    
    const modifyResponse = await axios.post(conf.MODIFY_ORDER_URL, payload);
    return modifyResponse.data;
  } catch (error: any) {
    console.error('Error modifying order:', error);
    return {
      stat: "Not_Ok",
      request_time: new Date().toISOString(),
      emsg: error.message || "An error occurred while modifying the order",
      error_details: error.response ? error.response.data : null
    };
  }
};

interface SingleOrderHistoryParams {
  norenordno: string;
}

interface SingleOrderHistoryResponse {
  [key: string]: any;

}

export const getOrderHistory = async (params: SingleOrderHistoryParams): Promise<SingleOrderHistoryResponse> => {
  console.log('Fetching single order history');
 
  // Get credentials from environment variables
  const config: ConfigType = {
    id: process.env.ID || "",
    password: process.env.PASSWORD || "",
    api_key: process.env.API_KEY || "",
    vendor_key: process.env.VENDOR_KEY || "",
    imei: process.env.IMEI || "",
    topt: process.env.TOTP || "",
  };
 
  try {
    // Authenticate first to get the token
    const token = await rest_authenticate(config);
 
    if (!token || token.length === 0) {
      console.log('Token is empty');
      return {
        stat: "Not_Ok",
        message: "Token generation issue"
      };
    }
 
    // Create the request parameters
    const orderHistoryParams = {
      uid: config.id,
      norenordno: params.norenordno
    };
 
    // Construct the payload
    let payload = 'jData=' + JSON.stringify(orderHistoryParams);
    payload = payload + `&jKey=${token}`;
 
    console.log('Requesting single order history with params:', {
      norenordno: params.norenordno
    });
    
    const historyResponse = await axios.post(conf.BASE_URL + '/SingleOrdHist', payload);
    console.log('Single order history response received');
 
    return historyResponse.data;
  } catch (error: any) {
    console.error('Error fetching single order history:', error);
    return {
      stat: "Not_Ok",
      request_time: new Date().toISOString(),
      emsg: error.message || "An error occurred while fetching order history",
      error_details: error.response ? error.response.data : null
    };
  }
};