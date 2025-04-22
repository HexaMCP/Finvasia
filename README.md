# Finvasia MCP Server

A Node.js-based server that connects to **Finvasia's Market Connect Protocol (MCP)** to enable seamless interaction with the Finvasia trading platform. This server acts as a bridge between Finvasia’s API and your trading application or frontend dashboard.

## 📌 Current Features

- 👤 Fetch **User Profile Data**
- 💰 Fetch **Account Balance**
- 🟢 **Buy Orders**
- 🔴 **Sell Orders**
- ❌ **Cancel Orders**
- 📈 **Current Stock Prices**
- 📊 **Positions**
- 💼 **Holdings**
- 💸 **Order Margin**
- 📚 **Order Book**

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

### 3. Build the Project
```bash
npm run build
```

## 🔐 Environment Setup
Create a .env file in the root directory with the following keys from Finvasia:
```bash
ID="Your Finvasia ID"
PASSWORD="Your Password"
VENDOR_KEY="Your Vendor Key"
IMEI="Your IMEI"
API_KEY="Your API Key"
TOTP="Your TOTP Code"
```

## ⚙️ MCP Configuration

In your mcp config json, add the following configuration block:

```json
{
  "Your MCP project name": {
    "type": "stdio",
    "command": "node",
    "args": [
      "Path of your index.js"
    ],
    "env": {
      "ID": "{}",
      "PASSWORD": "{}",
      "VENDOR_KEY": "{}",
      "IMEI": "{}",
      "API_KEY": "{}",
      "TOTP": "{}"
    }
  }
}
```
🗂️ Where to add this configuration:

For VS Code users, this config should be placed inside your settings.json
Replace "Path of your index.js" with the actual relative path to the built file, e.g., dist/index.js.


## 📞 Support

For any issues or assistance with the integration, please contact **[blaze.ws](https://blaze.ws)** for support.

You can reach out to us for troubleshooting, feature requests, or any general inquiries related to this MCP integration.









