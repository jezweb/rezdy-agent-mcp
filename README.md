# Rezdy Agent MCP Server

A Model Context Protocol (MCP) server for integrating with the Rezdy Agent API. This server provides tools for travel agents to search marketplace products, manage bookings, handle customer relationships, and process payments through Claude.

## Features

- **Marketplace Product Search**: Search products from all suppliers with advanced filtering
- **Availability & Pricing**: Real-time availability search with agent commission calculations
- **Booking Management**: Quote, create, update, and cancel bookings with 2-step process support
- **Customer Management**: Agent-owned customer database with full CRUD operations
- **Payment Processing**: Support for both manual and automated payment workflows
- **Commission Calculations**: Built-in agent pricing and commission handling
- **Rate Limiting**: Automatic rate limiting (100 calls/minute) with intelligent queuing
- **Environment Support**: Both staging and production environments

## Quick Start

### 1. Installation

First, clone and build the MCP server:

```bash
git clone https://github.com/jezweb/rezdy-agent-mcp.git
cd rezdy-agent-mcp
npm install
npm run build
```

### 2. Setup with Claude Desktop

Add the server to your Claude Desktop configuration:

**On macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**On Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "rezdy-agent": {
      "command": "node",
      "args": ["/path/to/rezdy-agent-mcp/build/index.js"]
    }
  }
}
```

### 3. Setup with Other Editors

#### Roo (Roo.dev)
Add to your Roo configuration:
```json
{
  "mcp": {
    "servers": {
      "rezdy-agent": {
        "command": "node",
        "args": ["/path/to/rezdy-agent-mcp/build/index.js"]
      }
    }
  }
}
```

#### Cline (VS Code Extension)
1. Install the Cline extension in VS Code
2. Open VS Code settings (Cmd/Ctrl + ,)
3. Search for "Cline MCP"
4. Add server configuration:
```json
{
  "cline.mcp.servers": {
    "rezdy-agent": {
      "command": "node",
      "args": ["/path/to/rezdy-agent-mcp/build/index.js"]
    }
  }
}
```

#### Cursor
1. Open Cursor Settings
2. Navigate to Extensions > MCP
3. Add server:
```json
{
  "mcpServers": {
    "rezdy-agent": {
      "command": "node",
      "args": ["/path/to/rezdy-agent-mcp/build/index.js"]
    }
  }
}
```

### 4. Get Your Rezdy Agent API Key

1. Log into your Rezdy Agent account
2. Go to Settings > API Keys
3. Create a new Agent API key
4. Copy the API key for configuration

### 5. Configure the Server

Once connected, configure the server with your Rezdy Agent credentials:

```
Use the rezdy_agent_configure tool with:
- apiKey: "your-agent-api-key"
- environment: "staging" or "production"
```

**Example**: "Configure Rezdy Agent with my API key abc123 for staging environment"

The assistant will run:
```typescript
rezdy_agent_configure({
  apiKey: "abc123",
  environment: "staging"
})
```

## Available Tools

### Configuration
- `rezdy_agent_configure` - Configure API key and environment

### Marketplace Product Management
- `rezdy_agent_search_products` - Search marketplace products with filters
- `rezdy_agent_get_product` - Get detailed product information
- `rezdy_agent_get_product_pickups` - Get pickup locations for products

### Availability & Pricing
- `rezdy_agent_search_availability` - Search availability with agent pricing

### Booking Management
- `rezdy_agent_quote_booking` - Get booking quotes with commission details
- `rezdy_agent_create_booking` - Create confirmed bookings
- `rezdy_agent_get_booking` - Get booking details
- `rezdy_agent_update_booking` - Update existing bookings
- `rezdy_agent_cancel_booking` - Cancel bookings

### Customer Management
- `rezdy_agent_search_customers` - Search agent customer database
- `rezdy_agent_create_customer` - Create new customer profiles
- `rezdy_agent_get_customer` - Get customer details

### Marketplace Data
- `rezdy_agent_get_categories` - Get product categories
- `rezdy_agent_get_locations` - Get marketplace locations
- `rezdy_agent_get_suppliers` - Get marketplace suppliers

## How to Use

Once configured, you can interact with the Rezdy marketplace through natural language. Here are some examples:

### Getting Started
- **"Configure Rezdy Agent with my API key abc123 for production"**
- **"Show me all marketplace categories"**
- **"Find suppliers in Sydney"**

### Product Discovery
- **"Search for wine tours in Sydney under $200"**
- **"Find water sports activities for next week"**
- **"Show me products from supplier ID 456"**
- **"Get details for product 789 including pickup locations"**

### Availability & Pricing
- **"Check availability for product 123 next week"**
- **"Show me pricing for 2 adults on product 456 for tomorrow"**
- **"What's available for product 789 in December?"**

### Booking Process
- **"Get a quote for John Doe (john@example.com) for product 123 with 2 adults"**
- **"Create a booking for Jane Smith for product 456 tomorrow at 10am"**
- **"Update booking ABC123 with new customer phone number"**
- **"Cancel booking DEF456 due to weather conditions"**

### Customer Management
- **"Search for customers with email containing 'gmail'"**
- **"Create a customer profile for Mike Johnson (mike@email.com)"**
- **"Show me details for customer ID 789"**

## Key Features

### Agent-Specific Functionality
- **Commission Calculations**: Automatic calculation of agent commissions and discounts
- **Agent Pricing**: Support for special agent rates and bulk discounts
- **Customer Database**: Agent-owned customer profiles for repeat bookings
- **Payment Options**: Choose between manual and automated payment processing

### Advanced Search & Filtering
- Filter by location, region, country
- Price range filtering
- Duration and category filters
- Supplier-specific searches
- Tag-based filtering

### Booking Flexibility
- Support for different booking modes (NO_DATE, DATE_ENQUIRY, INVENTORY)
- 2-step booking process
- Custom booking fields
- Participant management
- Promotional code support

## Payment Processing

### Manual Payments (Default)
- Agent processes payment outside of Rezdy
- Booking created with payment pending
- Agent marks payment as received manually

### Automated Payments (RezdyPay)
- Full payment processing through Rezdy
- Automatic payment confirmation
- Credit card processing with PCI compliance

## Usage Examples (Technical)

If you need to see the exact tool calls, here are examples:

### 1. Configure the Server
```typescript
rezdy_agent_configure({
  apiKey: "your-agent-api-key-here",
  environment: "production"
})
```

### 2. Search Marketplace Products
```typescript
rezdy_agent_search_products({
  limit: 20,
  location: "Sydney",
  categoryId: 5,
  minPrice: 50,
  maxPrice: 200,
  tags: ["wine", "food"]
})
```

### 3. Check Availability with Pricing
```typescript
rezdy_agent_search_availability({
  productId: 123,
  startDate: "2024-01-15",
  endDate: "2024-01-22",
  quantities: [
    { optionId: 1, value: 2 }, // 2 adults
    { optionId: 2, value: 1 }  // 1 child
  ]
})
```

### 4. Quote a Booking
```typescript
rezdy_agent_quote_booking({
  productId: 123,
  sessionId: "session-456",
  quantities: [{ optionId: 1, value: 2 }],
  customer: {
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com"
  },
  paymentType: "MANUAL",
  agentReference: "AGENT-REF-001"
})
```

### 5. Create a Booking
```typescript
rezdy_agent_create_booking({
  productId: 123,
  sessionId: "session-456",
  quantities: [{ optionId: 1, value: 2 }],
  customer: {
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
    phone: "+1234567890",
    address: {
      city: "Sydney",
      country: "Australia"
    }
  },
  paymentType: "AUTOMATED",
  agentReference: "BOOKING-001",
  notes: "Customer has mobility requirements"
})
```

## API Reference

### Marketplace Operations
- Search products across all suppliers with comprehensive filtering
- Get detailed product information including descriptions, images, and pricing
- Retrieve pickup locations and meeting points
- Access supplier information and ratings

### Availability & Pricing
- Real-time availability checking with capacity information
- Agent-specific pricing with commission calculations
- Support for group bookings and multiple pricing options
- Promotional code validation and discount application

### Booking Operations
- Two-step booking process (quote → confirm)
- Support for complex booking requirements
- Participant management for group bookings
- Custom field support for supplier-specific requirements

### Customer Management
- Agent-owned customer database
- Full customer profile management
- Search and filter capabilities
- Customer history and preferences tracking

### Rate Limiting
The server automatically handles Rezdy's rate limiting (100 calls per minute) by:
- Tracking request counts per minute
- Queuing requests when limit is reached
- Automatically retrying after the rate limit window

## Error Handling

The server provides comprehensive error handling:
- Validates all input parameters using Zod schemas
- Handles Rezdy API errors gracefully
- Provides clear error messages for debugging
- Validates customer data and booking requirements
- Checks date formats and business rules

## Troubleshooting

### Common Issues

#### "Rezdy Agent client not configured" Error
- Make sure to run the configuration step first: "Configure Rezdy Agent with my API key..."
- Verify your Agent API key is correct and has proper permissions

#### "Rate limit exceeded" Error  
- The server automatically handles rate limiting, but if you see this error, wait a minute and try again
- Consider reducing the frequency of requests

#### "Invalid booking dates" Error
- Ensure dates are in the correct format (YYYY-MM-DD for dates, ISO 8601 for date-times)
- Check that booking dates are not in the past
- Verify end date is after start date

#### Server Not Found in Claude Desktop
- Check that the path in your `claude_desktop_config.json` is correct
- Ensure the server was built successfully (`npm run build`)
- Restart Claude Desktop after making configuration changes

#### Permission Errors
- Make sure the `build/index.js` file has execute permissions
- On Unix systems: `chmod +x build/index.js`

### Getting Help

If you encounter issues:
1. Check the [Issues page](https://github.com/jezweb/rezdy-agent-mcp/issues)
2. Review the Rezdy Agent API documentation
3. Verify your API key permissions in Rezdy Agent settings

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details