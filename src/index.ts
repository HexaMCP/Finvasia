import express from "express";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import cron from 'node-cron';
import { z } from "zod";
import { zodToJsonSchema } from 'zod-to-json-schema';
import { getProfile } from "./services/users/profile";
import { checkBalance } from "./services/users/balance";
import { getWatchlist } from "./services/stocks/watchlist";
import { getQuotes, getStockList } from "./services/stocks/stocklist";
import { cancelOrder, checkOrderStatus, getHoldings, getOrderBook, getOrderMargin, getPositions, placeOrder , getTradeBook, modifyOrder,getOrderHistory} from "./services/orders/order";
import { updateInstruments } from './updateInstruments';

const server = new Server(
  {
    name: "finvasia",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  } 
);


const searchStocksSchema = z.object({
  stext: z.string().describe("Search text (e.g., stock name or symbol)"),
  exch: z.enum(["NSE", "BSE", "NFO"]).optional().describe("Exchange (NSE, BSE, NFO)"),
  instrumentType: z.string().optional().describe("Instrument type (e.g., FUTIDX, OPTIDX, EQ)"),
  optionType: z.string().optional().describe("Option type (CE, PE)"),
  expiryMonth: z.string().optional().describe("Expiry month (e.g., May, Jun, Jul)"),
  expiryYear: z.string().optional().describe("Expiry year (e.g., 2025)"),
  strikePrice: z.number().optional().describe("Exact strike price to filter (e.g., 50000)"),
  minStrike: z.number().optional().describe("Minimum strike price (e.g., 45000)"),
  maxStrike: z.number().optional().describe("Maximum strike price (e.g., 55000)"),
   limit: z.number().optional().default(100).describe("Maximum number of data"),
   offset: z.number().optional().default(0).describe("Number of data to skip"),
});

const placeOrderSchema = z.object({
  exch: z
    .enum(["NSE", "NFO", "CDS", "MCX", "BSE", "BFO"])
    .describe("Exchange"),
  tsym: z.string().describe("Trading symbol, stock symbol"),
  qty: z.number().describe("Order quantity"),
  prc: z.string().optional().describe("Order price"),
  prctyp: z
  .enum(["LMT", "MKT", "SL-LMT", "SL-MKT", "DS", "2L", "3L"])
  .optional()
  .describe("Price type"),
  prd: z.enum(["C", "M", "I", "B", "H"]).optional().describe("Product type (C / M / H / I/ B, C For CNC, M FOR NRML, I FOR MIS, B FOR BRACKET ORDER, H FOR COVER ORDER)"),
  trgprc: z
    .string()
    .optional()
    .describe("Trigger price (if price type is SL-LMT/SL-MKT orders)"),
  dscqty: z.number().optional().describe("Disclosed quantity"),
  trantype: z.enum(["B", "S"]).describe("B for Buy, S for Sell"),
  ret: z.enum(["DAY", "EOS", "IOC"]).optional().describe("Retention type"),
  bpprc: z.string().optional().describe(
    "Book profit price (optional)."
  ),
  blprc: z.string().optional().describe(
    "Stop loss price (optional)."
  ),
  trailprc: z.string().optional().describe(
    "Trailing stop loss price (optional)."
  ),
  remarks: z.string().optional().describe("Remarks for the order"),
});

const OrderStatusSchema = z.object({
  norenordno: z.string().describe("Order Number"),
  exch: z
    .string()
    .describe("Exchange on which order was placed"),
});

const CancelOrderSchema = z.object({
  norenordno: z.string().describe("order number to be canceled"),
});

const quotesSchema = z.object({
  exch: z
    .enum(["NSE", "NFO", "CDS", "MCX", "BSE", "BFO"])
    .describe("Exchange"),
  token: z.string().describe("Trading symbol Token")
});

const positionsSchema = z.object({
  actid: z.string().describe("Account ID")
});

const holdingsSchema = z.object({
  actid: z.string().describe("Account ID"),
  prd: z.enum(["C", "M", "I", "B", "H"]).optional().describe("Product name (C / M / H , C For CNC, M FOR NRML, I FOR MIS, B FOR BRACKET ORDER, H FOR COVER ORDER)"),
});

const orderMarginSchema = z.object({
  actid: z.string().describe("Account ID (optional)"),
  exch: z.string().describe("Exchange (e.g., NSE, BSE)"),
  tsym: z.string().describe("Trading symbol"),
  qty: z.string().describe("Order quantity"),
  prc: z.string().describe("Order price"),
  prd: z.enum(["C", "M", "I", "B", "H"]).describe("Product type (e.g., C / M / H , C For CNC, M FOR NRML, I FOR MIS, B FOR BRACKET ORDER, H FOR COVER ORDER)"),
  trantype: z.string().describe("Transaction type (B for Buy, S for Sell)"),
  prctyp: z.string().describe("Price type (LMT, MKT, SL-LMT, SL-MKT)"),
  // trgprc: z.union([z.string(), z.number()]).optional().describe("Trigger price (required for SL orders)"),
  // blprc: z.union([z.string(), z.number()]).optional().describe("Book loss price (optional)"),
  // fillshares: z.union([z.string(), z.number()]).optional().describe("Filled shares (optional)"),
  // norenordno: z.string().optional().describe("Existing order number (for modification)"),
});

const orderBookSchema = z.object({
  prd: z.enum(["C", "M", "I", "B", "H"]).describe("Product name filter (C / M / H , C For CNC, M FOR NRML, I FOR MIS, B FOR BRACKET ORDER, H FOR COVER ORDER)")
});

const SingleOrderHistorySchema = z.object({
  norenordno: z.string().describe("Order Number"),
});

const TradeBookSchema = z.object({
  actid: z.string().optional().describe("Account ID (optional)")
});

const ModifyOrderSchema = z.object({
  exch: z.string().describe("Exchange"),
  norenordno: z.string().describe("Noren order number to modify"),
  prctyp: z.string().optional().describe("Price type (LMT/MKT/SL-MKT/SL-LMT)"),
  prc: z.string().optional().describe("Modified price"),
  qty: z.string().optional().describe("Modified quantity"),
  tsym: z.string().describe("Trading symbol (must be the same as original order)"),
  ret: z.string().optional().describe("Retention type (DAY/IOC/EOS)"),
  trgprc: z.string().optional().describe("Trigger price for SL-MKT or SL-LMT"),
  bpprc: z.string().optional().describe("Book profit price (for Bracket orders)"),
  blprc: z.string().optional().describe("Book loss price (for High Leverage and Bracket orders)"),
  trailprc: z.string().optional().describe("Trailing price (for High Leverage and Bracket orders)")
});

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "Finvasia_Profile",
        description: "Finvasia user details or profile information or account details",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "Finvasia_Balance",
        description: "Finvasia balance details or balance information or account balance",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "Finvasia_Watchlist",
        description: "Finvasia watchlist or show watchlist or account watchlist",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "Finvasia_Search_Stocks",
        description: "List the stocks, search the stocks, stock details",
        inputSchema: zodToJsonSchema(searchStocksSchema),
      }, {
        name: "Get_Current_Price",
        description: "Get real-time price of stocks,options, or commodities",
        inputSchema: zodToJsonSchema(quotesSchema),
      }, {
        name: "Finvasia_Place_Order",
        description: "Place an order, buy or sell stocks, or place a trade",
        inputSchema: zodToJsonSchema(placeOrderSchema),
      }, {
        name: "Finvasia_Order_Status",
        description: "Check order status, order details, order information",
        inputSchema: zodToJsonSchema(OrderStatusSchema),
      }, {
        name: "Finvasia_Cancel_Order",
        description: "Cancel an order, cancel a trade, or cancel a stock order",
        inputSchema: zodToJsonSchema(CancelOrderSchema),
      }, {
        name: "Finvasia_Positions",
        description: "Fetch positions, get positions, or show positions",
        inputSchema: zodToJsonSchema(positionsSchema),
      }, {
        name: "Finvasia_Holdings",
        description: "Holdings details, get holdings, or show holdings",
        inputSchema: zodToJsonSchema(holdingsSchema),
      }, {
        name: "Get_Order_Margin",
        description: "Order margin details, get order margin, or show order margin",
        inputSchema: zodToJsonSchema(orderMarginSchema),
      }, {
        name: "Get_Order_Book",
        description: "Order book details, get order book, or show order book",
        inputSchema: zodToJsonSchema(orderBookSchema),
      }, {
        name: "Finvasia_TradeBook",
        description: "Get the trade book showing all executed trades for the account",
        inputSchema: zodToJsonSchema(TradeBookSchema),
      } , {
        name: "Finvasia_ModifyOrder",
        description: "Modify an existing open order",
        inputSchema: zodToJsonSchema(ModifyOrderSchema),
      },{
        name: "Get_Order_History",
        description: "Get the detailed order history of a specific order by its order number",
        inputSchema: zodToJsonSchema(SingleOrderHistorySchema),
      }
    ],
  };
});



server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    switch (request.params.name) {
      case "Finvasia_Profile": {
        const user = await getProfile();
        if (!user) {
          return {
            content: [
              {
                type: "text",
                text: "Failed to retrieve balance data.",
              },
            ],
          };
        }
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(user, null, 2),
            },
          ],
        };
      }
      case "Finvasia_Balance": {
        const balance = await checkBalance();
        if (!balance) {
          return {
            content: [
              {
                type: "text",
                text: "Failed to retrieve balance information.",
              },
            ],
          };
        }
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(balance, null, 2),
            },
          ],
        };
      }
      case "Finvasia_Watchlist": {
        const watchlist = await getWatchlist();
        if (!watchlist) {
          return {
            content: [
              {
                type: "text",
                text: "Failed to retrieve watchlist information.",
              },
            ],
          };
        }
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(watchlist, null, 2),
            },
          ],
        };
      }
      case "Finvasia_Search_Stocks": {
        const { 
          stext, 
          exch, 
          instrumentType, 
          optionType, 
          expiryMonth, 
          expiryYear,
          strikePrice,
          minStrike,
          maxStrike,
          limit, 
          offset
        } = request.params.arguments as { 
          stext?: string; 
          exch?: string; 
          instrumentType?: string;
          optionType?: string;
          expiryMonth?: string;
          expiryYear?: string;
          strikePrice?: number;
          minStrike?: number;
          maxStrike?: number;
          limit?: number;
          offset?: number;
        };
      
        try {
          const query = stext || "a";
          const exchange = exch || "NSE";
          const limit_value = limit ? limit > 100 ? 100 : limit : 100;

          
          // Regular stock search with filters
          const stocklist = await getStockList({ 
            query, 
            exchange, 
            instrumentType, 
            optionType, 
            expiryMonth, 
            expiryYear,
            strikePrice,
            minStrike,
            maxStrike,
            limit: limit_value, 
            offset
          });
          
          if (typeof stocklist === "object" && stocklist !== null && "stat" in stocklist && stocklist["stat"] === "Ok") {
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(stocklist, null, 2),
                },
              ],
            };
          }
          
          return {
            content: [
              {
                type: "text",
                text: "No matching stocks found.",
              },
            ],
          };
        } catch (err) {
          console.error("Error searching stocks:", err);
          return {
            content: [
              {
                type: "text",
                text: "Failed to retrieve stock data.",
              },
            ],
          };
        }
      }
      case "Get_Current_Price": {
        const { exch, token } = request.params.arguments as { exch: string; token: string };
        try {
          const quotesResponse = await getQuotes({ exch, token });

          if (!quotesResponse || quotesResponse.stat === "Not_Ok") {
            return {
              content: [
                {
                  type: "text",
                  text: `Failed to fetch quotes: ${quotesResponse?.emsg || quotesResponse?.message || "Unknown error"}`,
                },
              ],
            };
          }

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(quotesResponse, null, 2),
              },
            ],
          };
        } catch (error: any) {
          return {
            content: [
              {
                type: "text",
                text: `Error fetching quotes: ${error.message}`,
              },
            ],
          };
        }
      }
      case "Finvasia_Place_Order": {
        const params = request.params.arguments;
        if (!params) {
          throw new Error("Provide all needed details to place an order");
        }
        try {
          const defaults = {
            ret: "DAY",
            prd: "C",
            prctyp: params.prctyp ? params.prctyp : params.prc ? "LMT" : "MKT", // Default to LMT if price is provided, else MKT
          };

          const orderPayload = {
            exch: String(params.exch),
            tsym: String(params.tsym),
            qty: String(params.qty),
            prc: String(params.prc || "0"), // Default price to "0" if not provided
            trgprc: String(params.trgprc || "0"), // Default trigger price to "0" if not provided
            dscqty: String(params.qty),
            prd: String(params.prd || defaults.prd),
            trantype: String(params.trantype),
            prctyp: String(params.prctyp || defaults.prctyp),
            ret: String(params.ret || defaults.ret),
            remarks: String(params.remarks || ""),
            blprc: String(params.blprc || ""), // Default to "0" if not provided
            bpprc: String(params.bpprc || ""), // Default to "0" if not provided
            trailprc: String(params.trailprc || ""), // Default to "0" if not provided
          };

          const orderResult = await placeOrder(orderPayload);


          if (typeof orderResult === "object" && orderResult !== null && "stat" in orderResult && orderResult["stat"] === "Ok") {
            return {
              content: [
                {
                  type: "text",
                  text: `Order placed successfully: ${JSON.stringify(
                    orderResult,
                    null,
                    2
                  )}`,
                },
              ],
            };

          }

          // Success response
          return {
            content: [
              {
                type: "text",
                text: `order not placed, ensure all needed details are provided ${JSON.stringify(orderResult, null, 2)}`,
              },
            ],
          };

        } catch (err) {
          console.error("Error placing order:", err);
          return {
            content: [
              {
                type: "text",
                text: `An error occurred while placing the order`,
              },
            ],
          };
        }
      }
      case "Finvasia_Order_Status": {
        const params = request.params.arguments;

        try {
          const { norenordno, exch } = params as { norenordno: string; exch: string };
          const statusResponse = await checkOrderStatus({ norenordno, exch });

          if (!statusResponse || statusResponse.stat === "Not_Ok") {
            return {
              content: [
                {
                  type: "text",
                  text: `couldn’t verify your order status at the moment`,
                },
              ],
            };
          }

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(statusResponse, null, 2),
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `couldn’t verify your order status at the moment`,
              },
            ],
          };
        }
      }
      case "Finvasia_Cancel_Order": {
        const params = request.params.arguments;

        try {
          const { norenordno } = params as { norenordno: string; };
          const cancelResult = await cancelOrder({ norenordno });

          if (typeof cancelResult === "object" && cancelResult !== null && "stat" in cancelResult && cancelResult["stat"] === "Ok") {
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(cancelResult, null, 2),
                },
              ],
            };
          }

          return {
            content: [
              {
                type: "text",
                text: `couldn’t verify your order status at the moment`,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `An error occurred while canceling the order`,
              },
            ],
          };
        }
      }
      case "Finvasia_Positions": {
        const { actid } = request.params.arguments as { actid?: string };
        try {
          // Fetch positions data
          const positionsResponse = await getPositions({ actid });

          if (typeof positionsResponse === "object" && positionsResponse !== null && "stat" in positionsResponse && positionsResponse["stat"] === "Ok") {
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(positionsResponse, null, 2),
                },
              ],
            };
          }

          return {
            content: [
              {
                type: "text",
                text: `couldn’t get positions at the moment ${JSON.stringify(positionsResponse, null, 2)}`,
              },
            ],
          };


        } catch (error: any) {
          return {
            content: [
              {
                type: "text",
                text: `Error fetching positions: ${error.message}`,
              },
            ],
          };
        }
      }
      case "Finvasia_Holdings": {
        const { actid, prd } = request.params.arguments as { actid?: string; prd?: string };
        try {
          const holdingsResponse = await getHoldings({ actid, prd: prd ? prd : "C" });

          if (typeof holdingsResponse === "object" && holdingsResponse !== null && "stat" in holdingsResponse && holdingsResponse["stat"] === "Ok") {
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(holdingsResponse, null, 2),
                },
              ],
            };
          }

          return {
            content: [
              {
                type: "text",
                text: `${JSON.stringify(holdingsResponse, null, 2)}`,
              },
            ],
          };
        } catch (error: any) {
          return {
            content: [
              {
                type: "text",
                text: `Error fetching holdings: ${error.message}`,
              },
            ],
          };
        }
      }
      case "Get_Order_Margin": {
        const args = request.params.arguments as Record<string, unknown>;
        const params = {
          exch: String(args.exch || ''),
          tsym: String(args.tsym || ''),
          qty: args.qty as string,
          prc: args.prc as string,
          prd: args.prd && args.exch == "NFO" ? "M" :args.prd ? args.prd as string : "C",
          trantype: String(args.trantype || ''),
          prctyp: String(args.prctyp || ''),
          trgprc: args.trgprc as string || '',
          blprc: args.blprc as string | '',
          fillshares: args.fillshares as string |'',
          norenordno: args.norenordno as string | ""
        };

        try {


          const marginResponse = await getOrderMargin(params);

          if (typeof marginResponse === "object" && marginResponse !== null && "stat" in marginResponse && marginResponse["stat"] === "Ok") {
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(marginResponse, null, 2),
                },
              ],
            };
          }

          return {
            content: [
              {
                type: "text",
                text: `${JSON.stringify(marginResponse, null, 2)}`,
              },
            ],
          };
        } catch (error: any) {
          return {
            content: [
              {
                type: "text",
                text: `Error calculating order margin: ${error.message}`,
              },
            ],
          };
        }
      }
      case "Get_Order_Book": {
        const { prd } = request.params.arguments as { prd?: string };

        try {
          // Fetch order book data
          const orderBookResponse = await getOrderBook({ prd: prd ? prd : "C" });

          if (typeof orderBookResponse === "object" && orderBookResponse !== null && "stat" in orderBookResponse && orderBookResponse["stat"] === "Ok") {
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(orderBookResponse, null, 2),
                },
              ],
            };
          }

          return {
            content: [
              {
                type: "text",
                text: `${JSON.stringify(orderBookResponse, null, 2)}`,
              },
            ],
          };

        } catch (error: any) {
          return {
            content: [
              {
                type: "text",
                text: `Error fetching order book: ${error.message}`,
              },
            ],
          };
        }
      }

      case "Finvasia_TradeBook": {
        const tradeBook = await getTradeBook();
        
        if (!tradeBook || tradeBook.stat === "Not_Ok") {
          return {
            content: [
              {
                type: "text",
                text: `Failed to retrieve trade book: ${tradeBook?.emsg || "Unknown error"}`,
              },
            ],
          };
        }
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(tradeBook, null, 2),
            },
          ],
        };
      }
      case "Finvasia_ModifyOrder": {
        const params = request.params.arguments;
        if (!params) {
          throw new Error("Invalid request: 'params' is undefined.");
        }
        
        try {
          // Set defaults if parameters are missing
          const defaults = {
            ret: "DAY",
            prctyp: params.prc ? "LMT" : "MKT", // Default to LMT if price is provided, else MKT
          };
          
          // Create the modify payload with proper type casting
          const modifyPayload = {
            exch: String(params.exch),
            norenordno: String(params.norenordno),
            tsym: String(params.tsym),
            // Only add optional parameters if they are provided
            ...(params.qty !== undefined ? { qty: String(params.qty) } : {}),
            ...(params.prc !== undefined ? { prc: String(params.prc) } : {}),
            ...(params.prctyp !== undefined ? { prctyp: String(params.prctyp) } : { prctyp: defaults.prctyp }),
            ...(params.ret !== undefined ? { ret: String(params.ret) } : { ret: defaults.ret }),
            ...(params.trgprc !== undefined ? { trgprc: String(params.trgprc) } : {}),
            ...(params.bpprc !== undefined ? { bpprc: String(params.bpprc) } : {}),
            ...(params.blprc !== undefined ? { blprc: String(params.blprc) } : {}),
            ...(params.trailprc !== undefined ? { trailprc: String(params.trailprc) } : {})
          };
          
          // Call the modifyOrder function
          const modifyResult = await modifyOrder(modifyPayload);
          
          // Check if modification was successful
          if (typeof modifyResult === "object" && modifyResult !== null && 
              "stat" in modifyResult && modifyResult["stat"] === "Ok") {
            return {
              content: [
                {
                  type: "text",
                  text: `Order modified successfully: ${JSON.stringify(modifyResult, null, 2)}`,
                },
              ],
            };
          }
          
          // Return error if modification failed
          return {
            content: [
              {
                type: "text",
                text: `Order not modified: ${JSON.stringify(modifyResult, null, 2)}. Ensure all needed details are provided: ${JSON.stringify(params, null, 2)}`,
              },
            ],
          };
        } catch (err) {
          console.error("Error modifying order:", err);
          return {
            content: [
              {
                type: "text",
                text: `An error occurred while modifying the order`,
              },
            ],
          };
        }
      }
      case "Get_Order_History": {
          const { norenordno } = request.params.arguments as { norenordno: string };
          const orderHistory = await getOrderHistory({ norenordno });
          
          if (typeof orderHistory === "object" && orderHistory !== null && "stat" in orderHistory && orderHistory["stat"] === "Ok") {
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(orderHistory, null, 2),
                },
              ],
            };
          }
          return {
            content: [
              {
                type: "text",
                text: `${JSON.stringify(orderHistory, null, 2)}`,
              },
            ],
          };
        }
           
      default:
        throw new Error(`Unknown tool: ${request.params.name}`);
    }
  } catch (error) {
    console.error("Error in request handler:", error);
    return {
      result: {
        error: `An error occurred while processing the request: ${request.params.name} at this moment`,
      },
    };
  }
});

// Create Express app
const app = express();
app.use(express.json());

// Store SSE transports
const sseTransports: Record<string, SSEServerTransport> = {};

// SSE endpoint for clients
app.get('/', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  // Create SSE transport
  const transport = new SSEServerTransport('/messages', res);
  sseTransports[transport.sessionId] = transport;
  
  console.log(`New SSE connection established: ${transport.sessionId}`);
  
  // res.on("close", () => {
  //   console.log(`SSE connection closed: ${transport.sessionId}`);
  //   delete sseTransports[transport.sessionId];
  // });
  
  await server.connect(transport);
});

// Message endpoint for SSE clients
app.post('/messages', async (req, res) => {
  const sessionId = req.query.sessionId as string;
  const transport = sseTransports[sessionId];
  
  if (transport) {
    await transport.handlePostMessage(req, res, req.body);
  } else {
    res.status(400).send('No transport found for sessionId');
  }
});
// Schedule daily at 2 AM
cron.schedule('0 2 * * *', async () => {
  console.log('Running scheduled instrument data update...');
  try {
    await updateInstruments();
    console.log('Instrument data update completed successfully');
  } catch (error) {
    console.error('Instrument data update failed:', error);
  }
});

console.log('Scheduled Stock data updates enabled (daily at 2 AM)');
// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Finvasia MCP Server running on http://localhost:${PORT}`);
});
