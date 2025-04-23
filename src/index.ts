import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { zodToJsonSchema } from 'zod-to-json-schema';
import { getProfile } from "./services/users/profile";
import { checkBalance } from "./services/users/balance";
import { getWatchlist } from "./services/stocks/watchlist";
import { getQuotes, getStockList } from "./services/stocks/stocklist";
import { cancelOrder, checkOrderStatus, getHoldings, getOrderBook, getOrderHistory, getOrderMargin, getPositions, placeOrder } from "./services/orders/order";


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
  stext: z.string().describe("Search text (e.g., stock name or sector)"),
  exch: z.enum(["NSE", "BSE", "NFO"]).optional().describe("Exchange (NSE, BSE, NFO)"),
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
  qty: z.union([z.string(), z.number()]).describe("Order quantity"),
  prc: z.union([z.string(), z.number()]).describe("Order price"),
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
      },
      {
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
        const { stext, exch } = request.params.arguments as { stext?: string; exch?: string };
        try {
          const query = stext || "a";
          const exchange = exch || "NSE";

          const stocklist = await getStockList({ query, exchange });

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
          qty: args.qty as string | number,
          prc: args.prc as string | number,
          prd: String(args.prd || 'C'),
          trantype: String(args.trantype || ''),
          prctyp: String(args.prctyp || ''),
          actid: args.actid as string,
          trgprc: args.trgprc as string | number,
          blprc: args.blprc as string | number,
          fillshares: args.fillshares as string | number,
          norenordno: args.norenordno as string
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

async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.log(JSON.stringify({ message: "Finvasia MCP Server running on stdio" }));
}

runServer().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});

