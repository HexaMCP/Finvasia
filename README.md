# Finvasia MCP Server

A Node.js-based server that connects to **Finvasia's Market Connect Protocol (MCP)** to enable seamless interaction with the Finvasia trading platform. This server acts as a bridge between Finvasia’s API and your trading application or frontend dashboard.

![](https://github.com/HexaMCP/Finvasia/blob/main/main.py---telegram-mcp---Cursor-2025-05-02-12-17-03.gif)


## 📌 Current Features

- 👤 Fetch **User Profile Data**
- 💰 Fetch **Account Balance**
- 🟢 **Buy Orders**
- 🔴 **Sell Orders**
- ❌ **Cancel Orders**
- ✏️ **Modify Orders**
- 📈 **Current Stock Prices**
- 📊 **Positions**
- 💼 **Holdings**
- 💸 **Order Margin**
- 📚 **Order Book**
- 📒 **Trade Book**
- 🎯 **Take Profit** Orders
- 🛑 **Stop Loss** Orders
- 🧠 **Options Buy & Sell**

More features and modules will be added progressively.

## 🛠️ Tech Stack

- **Backend**: Node.js
- **Broker API**: Finvasia Shoonya (MCP)

# Finvasia MCP Integration

This repository provides a basic integration setup for **Finvasia API** with the **Model Context Protocol (MCP)** server. It enables you to connect and access your Finvasia account through a standardized stdio interface, allowing seamless compatibility with MCP-based applications.

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/HexaMCP/Finvasia.git
cd Finvasia
```

### 2. Install Dependencies

```bash
npm install
```

## 🔐 3. Environment Setup

Create a .env file in the root directory with the following keys from Finvasia:

```bash
ID="Your Finvasia ID"
PASSWORD="Your Password"
VENDOR_KEY="Your Vendor Key"
IMEI="Your IMEI"
API_KEY="Your API Key"
TOTP="Your TOTP Code"
```

### 4. Build the Project

```bash
npm run build
```

### 5. Start the Project

```bash
npm start
```

Start the MCP server in your respective port (ex: http://localhost:3000)


### ⚙️ MCP Configuration for SSE

In your mcp config json, add the following configuration block:

```json
{
  "Your MCP project name": {
    "type": "sse",
    "url": "http://localhost:3000",
  }
}
````

🗂️ Where to add this configuration:

For VS Code users, this config should be placed inside your settings.json.

## 📞 Support

For any issues or assistance with the integration, please contact **[blaze.ws](https://blaze.ws)** for support.

You can reach out to us for troubleshooting, feature requests, or any general inquiries related to this MCP integration.
