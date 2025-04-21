class Config {
  HEADERS: Record<string, string> = { 'Content-Type': 'application/json' };
  BASE_URL: string = "https://api.shoonya.com/NorenWClientTP";
  VALIDATE_REQUEST_CODE_URL: string = "https://authapi.flattrade.in/trade/apitoken";
  LOGIN_URL: string = `${this.BASE_URL}/QuickAuth`;
  LIMITS_URL: string = `${this.BASE_URL}/Limits`;
  POSITIONS_URL: string = `${this.BASE_URL}/PositionBook`;
  HOLDINGS_URL: string = `${this.BASE_URL}/Holdings`;
  WATCHLIST_URL: string = `${this.BASE_URL}/MWList`;
  UserDetails_URL: string = `${this.BASE_URL}/UserDetails`;
  marketWatch_URL: string = `${this.BASE_URL}/MarketWatch`;
  StockList_URL: string = `${this.BASE_URL}/SearchScrip`;
  placeOrder_URL: string = `${this.BASE_URL}/PlaceOrder`;
  SINGLE_ORDER_STATUS_URL = `${this.BASE_URL}/SingleOrdStatus`
  GET_QUOTES_URL: string = `${this.BASE_URL}/GetQuotes`;
  ORDER_MARGIN_URL: string = `${this.BASE_URL}/GetOrderMargin`;
  ORDER_BOOK_URL: string = `${this.BASE_URL}/OrderBook`;
}

export default Config;